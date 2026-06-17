/*
  API biztonsag -- hogyan vedd meg az Express szervert a tipikus tamadaok ellen?

  Ha irsz egy API-t es kirakod a netre, azonnal celpontta valik. Automatizalt
  botok allandoan keresik a sebezheto szervereket, probalgatjak a tipikus
  tamadasi vektorokat. Nem az a kerdes, hogy "fognak-e tamadni", hanem az,
  hogy "mikor es mennyire leszek felkeszulve ra".

  Az jo hir az, hogy a legtobb tamadas ellen viszonylag egyszeru modon
  vedekezhetsz. Ebben a fajlban megnezzuk a legfontosabb eszkozoket es
  technikaakat.
*/

import express, { Request, Response, NextFunction } from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";


/* --- 1. Helmet -- HTTP biztonsagi headerek ---

  A Helmet egy Express middleware, ami automatikusan beallitja a
  legfontosabb biztonsagi HTTP headereket. Ezek a headerek utasitjak
  a bongeszoket, hogy hogyan kezeljek az oldalad tartalmat.

  Miert fontosak? Mert sok tamadas (XSS, clickjacking, MIME sniffing)
  ellen a bongeszo tud vedeni, de csak akkor, ha a szerver megmondja
  neki, hogy tegyen meg. A headerek nelkul a bongeszo "megbizik" mindenben.
*/

const app = express();

// A helmet() egyetlen sorral bekapcsol tobb tucat biztonsagi headert.
// Ezt mindig az elso middleware-ek kozott kell hasznalni.
app.use(helmet());

// De nezzuk meg, mit csinal belulrol, mert fontos erteni:

// Content-Security-Policy: megmondja a bongeszonek, honnan toltheto be
// script, stilus, kep, stb. Ez az egyik legerosebb vedelem XSS ellen.
// Ha a tamado bejuttat egy <script> taget, a bongeszo nem futtatja le,
// mert nem az engedelyezett forrasbol szarmazik.
//
// X-Content-Type-Options: nosniff -- megakadalyozza, hogy a bongeszo
// "kitalaalja" a fajl tipusat. Nelkule egy tamado atnevezheti a
// .js fajlt .png-re, es a bongeszo megis futtatja mint scriptet.
//
// X-Frame-Options: DENY -- megakadalyozza, hogy az oldalad iframe-ben
// jelenjen meg mas oldalon. Ez a clickjacking elleni vedelem.
//
// Strict-Transport-Security: a bongeszo csak HTTPS-en keresztul
// kommunikal a szerverrel, meg akkor is, ha a felhasznalo HTTP-t irr be.


/* --- 2. Rate Limiting -- tamadaok lassitasa ---

  A rate limiting korlatozza, hogy egy kliens (IP cim) hanyszor kuldhet
  kerest egy adott idoszakban. Ez veedd:

  - Brute force tamadas ellen (jelsszo probalgatas)
  - DDoS ellen (tulsagosan sok keres)
  - API visszaeles ellen (pl. scraping)

  Fontos: a rate limiting nem old meg minden problemat, de jelentosen
  megneheziti a tamadok dolgaat.
*/

// Altalanos rate limit az egesz API-ra
const altalanos = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 perces ablak
  max: 100,                    // maximum 100 kerest enged ablakonkent
  standardHeaders: true,       // RateLimit-* headerek a valaszban
  legacyHeaders: false,        // ne kuldje a regi X-RateLimit-* headereket
  message: {
    hiba: "Tul sok keres, probald ujra kesobb",
  },
});

app.use("/api/", altalanos);

// Szigorubb rate limit a bejelentkezesre
// Miert kuloon? Mert a login endpoint kulonosen sebezheto brute force-ra.
// Ha valaki masodpercenkent probalgat jelszavakat, gyorsan megtalaalja
// a gyenge jelszavakat. Ezert itt sokkal alacsonyabb a limit.
const loginLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,                      // 15 perc alatt maximum 5 login proba
  message: {
    hiba: "Tul sok bejelentkezesi kiserlet, probald ujra 15 perc mulva",
  },
});

// app.post("/api/login", loginLimit, loginController);


/* --- 3. CORS (Cross-Origin Resource Sharing) ---

  A CORS szabalyozza, hogy mely domain-ekrol jovokeresek ferhetnek
  hozza az API-dhoz. Alapertelmezesben a bongeszok blokkolnak minden
  cross-origin kerest (ez a Same-Origin Policy).

  Peldaul: ha az API-d a https://api.pelda.hu cimen fut, es a
  frontend a https://pelda.hu cimen, az ket kulonbozo origin. A
  bongeszo alapbol nem engedi, hogy a frontend JavaScript-je
  elerjje az API-t, hacsak az API nem kuldi vissza a megfelelo
  CORS headereket.
*/

import cors from "cors";

// ROSSZ -- mindent enged (development-ben jogos, production-ben tilos)
// app.use(cors()); // Ez barkinek engedi a hozzaferest!

// JO -- csak az engedelyezett domain-ek ferhetnek hozza
const corsBeallitasok: cors.CorsOptions = {
  origin: [
    "https://pelda.hu",
    "https://admin.pelda.hu",
  ],
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,    // sutiket is atengedi
  maxAge: 86400,        // preflight cache 24 oraig (csokkenti a keresek szamat)
};

app.use(cors(corsBeallitasok));


/* --- 4. Egyeb fontos biztonsagi beallitasok ---

  Ezek apro dolgok, de mindegyik egy-egy tamadasi vektort zar le.
*/

// JSON body parser -- meretkorllattal!
// Korlatozzuk a request body meretet, hogy ne lehessen hatalmas
// JSON-okat kuldeni, amik kifogyasztjak a szerver memoriajaaat.
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

// Rejtsd el, milyen technologiat hasznalsz
// Alapertelmezesben az Express kuldi az "X-Powered-By: Express" headert.
// Ez informaciot ad a tamadoknak arrol, milyen keretrendszert hasznalsz.
app.disable("x-powered-by"); // A helmet is csinalja, de biztos ami biztos

// Biztonssagos cookie beallitasok (ha cookie-t hasznalsz)
// app.use(session({
//   cookie: {
//     secure: true,     // Csak HTTPS-en kuldi
//     httpOnly: true,   // JavaScript nem feri hozza (XSS vedelem)
//     sameSite: "strict", // CSRF vedelem
//     maxAge: 3600000,  // 1 ora mulva lejar
//   }
// }));


/* --- 5. Request logging biztonsagi szempontbol ---

  A naplozas nem kozvetlenul ved tamadas ellen, de nelkule nem tudod
  utoolag kivizsgalni, mi tortent. Ha tortenik egy incidens, a logok
  lesznek az egyetlen nyomod.

  Fontos: SOHA ne logolj jelszavakat, tokeneket, vagy mas erzekeny adatot!
*/

function biztonsagiNaplozo(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  const naplobejegyzes = {
    idopont: new Date().toISOString(),
    metodus: req.method,
    utvonal: req.path,
    ip: req.ip,
    userAgent: req.get("User-Agent"),
    // NE logold: req.body (lehet benne jelszo), req.headers.authorization
  };

  console.log("[Biztonsagi naplo]", JSON.stringify(naplobejegyzes));
  next();
}

app.use(biztonsagiNaplozo);


/* --- 6. Pelda route-ok a biztonsagos API-hoz --- */

app.get("/api/egeszseeg", (_req: Request, res: Response) => {
  // Az egeszseg-ellenorzo endpoint ne adjon ki erzekeny informaciot
  // (adatbazis verzioo, belso IP-k, stb.)
  res.json({ statusz: "ok" });
});

app.get("/api/vedett", (_req: Request, res: Response) => {
  res.json({ uzenet: "Ezt csak autentikalt felhasznalok lathatjak" });
});

// 404 kezelo -- ne adjon ki reszletes informaciot
app.use((_req: Request, res: Response) => {
  res.status(404).json({ hiba: "Az endpoint nem talalhato" });
});

// Hibakezelő middleware -- soha ne kuldd ki a stack trace-t production-ben
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error("[Hiba]", err.message);
  const production = process.env.NODE_ENV === "production";
  res.status(500).json({
    hiba: production
      ? "Szerverhiba tortent"
      : err.message,
    // SOHA ne kuldd ki a stack trace-t production-ben!
    // stack: production ? undefined : err.stack,
  });
});


/* --- Osszefoglalas ---

  - Hasznald a helmet-et -- egyetlen sor, rengeteg vedelem
  - Allits be rate limitet, kulonosen a login endpoint-ra
  - CORS-t konfigurald explicit modon, ne engedj mindent
  - Korlatozd a request body meretet
  - Rejtsd el a szerver technologiai informacioit
  - Naplozz mindent, de ne naplozz erzekeny adatokat
  - Hibauzenetek ne tartalmazzzanak belso reszleteket production-ben

  A kovetkezo fajlban megnezzuk a tipikus sebezhetosegeket es
  tamadasi modszereket (OWASP Top 10).
*/

export { app };
