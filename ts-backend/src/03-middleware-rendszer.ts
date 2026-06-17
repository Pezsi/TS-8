/*
  A middleware rendszer -- az Express lelke

  Ha meg kell nevezni egyetlen dolgot, ami az Express-t erssseee es
  rugalmassa teszi, az a middleware rendszer. De mi is az a middleware?

  Kepzeld el igy: a HTTP keres es a vegleges valasz kozott egy csovezetek
  van, es ezen a csovezeteken szurook (middleware-ek) vannak. Minden
  szuro megkapja a kerest, csinalhat vele valamit, es utana:
  - Tovabbadja a kovetkezo szuronek (next())
  - Vagy befejezi a valaszt (res.send())

  Peldak middleware-ekre:
  - JSON parser: a nyers request body-t JSON objektumma alakitja
  - Logging: naplozza a kereseket
  - Autentikacio: ellenorzi, hogy a felhasznalo be van-e jelentkezve
  - CORS: beallitja a cross-origin headereket
  - Hibakezelő: elkapja a hibakat es formatalt valaszt kuld
*/

import express, { Request, Response, NextFunction } from "express";

const app = express();


/* --- 1. Hogyan mukodik a middleware lanc? ---

  A middleware fuggvenyek harom parametert kapnak:
  - req: a HTTP keres objektuma
  - res: a HTTP valasz objektuma
  - next: fuggveny, ami a kovetkezo middleware-t hivja meg

  A SORREND SZAMIT! A middleware-ek abban a sorrendben futnak le,
  ahogy regisztralod oket. Ha az autentikacios middleware a json
  parser elott van, nem fogja tudni olvasni a request body-t.
*/

// Egyszeru logging middleware
function naplozas(req: Request, _res: Response, next: NextFunction): void {
  const idopont = new Date().toISOString();
  console.log(`[${idopont}] ${req.method} ${req.url}`);
  next(); // FONTOS: next() nelkul a keres "beragad" es soha nem kap valaszt
}

// Regisztralas: ez az osszes utana kovetkezo route-ra vonatkozik
app.use(naplozas);

// A JSON parser UTANA jon -- igy a naplozas meg azelott lefut,
// hogy a body parse-olodna
app.use(express.json());


/* --- 2. Sajat middleware irrasa ---

  A middleware-ek nagyon jol hasznalhatoak ismeetlodo logika
  kiemelesere. Peldaul: ha minden keresnel ellenorizni akarod,
  hogy a felhasznalo be van-e jelentkezve, nem akarsz minden
  route-ban kulon megirni.
*/

// Idomeero middleware -- meeri, mennyi ideig tart egy keres feldolgozasa
function keresFeldolgozasiIdo(req: Request, res: Response, next: NextFunction): void {
  const kezdet = Date.now();

  // A "finish" esemeny akkor fut, amikor a valasz elkuldodott
  res.on("finish", () => {
    const idotartam = Date.now() - kezdet;
    console.log(
      `${req.method} ${req.url} - ${res.statusCode} (${idotartam}ms)`
    );
  });

  next();
}

app.use(keresFeldolgozasiIdo);

// Request ID middleware -- minden kereshez egyedi azonositot rendel
// Ez a hibakeresésnel nagyon hasznos: ha valami elromlik, az ID alapjan
// osszekovethetoed a naplokban, mi tortent a keressel.
function keresAzonositoHozzaadas(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const keresId = `req-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

  // A headerre is ratesszzuk, hogy a kliens is latja
  res.setHeader("X-Request-ID", keresId);

  // A request objektumra is ratesszzuk, hogy a tobbi middleware laathassa
  (req as Request & { keresId: string }).keresId = keresId;

  next();
}

app.use(keresAzonositoHozzaadas);


/* --- 3. Route-specifikus middleware ---

  Nem kell minden middleware-nek globalisnak lennie. Lehetsz szelektiv:
  bizonyos middleware-eket csak bizonyos route-okra alkalmazol.
*/

// Autentikacios middleware (egyszerusitett pelda)
function autentikaciKotelezo(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const token = req.headers.authorization;

  if (!token || !token.startsWith("Bearer ")) {
    res.status(401).json({ hiba: "Bejelentkezes szukseges" });
    return;
  }

  // Valos alkalmazasban itt a tokent ellenorizneed (jwt.verify)
  // Most egyszerusitunk:
  const tokenErtek = token.replace("Bearer ", "");
  if (tokenErtek === "ervenytelen") {
    res.status(401).json({ hiba: "Ervenytelen token" });
    return;
  }

  next();
}

// Publikus route -- nincs autentikacios middleware
app.get("/api/publikus", (_req: Request, res: Response) => {
  res.json({ uzenet: "Ezt barki lathatja" });
});

// Vedett route -- az autentikacios middleware a route ELOTT all
app.get("/api/vedett", autentikaciKotelezo, (_req: Request, res: Response) => {
  res.json({ uzenet: "Ezt csak bejelentkezett felhasznalok lathatjak" });
});

// Tobb middleware is lanchatolhato egyetlen route-ra:
function adminKell(req: Request, res: Response, next: NextFunction): void {
  // Egyszerusitett pelda -- valosagban a JWT payload-bol olvasnank
  const szerep = req.headers["x-role"];
  if (szerep !== "admin") {
    res.status(403).json({ hiba: "Adminisztratori jogosultsag szukseges" });
    return;
  }
  next();
}

// Eloszor autentikacio, utana admin ellenorzes, utana a handler
app.delete(
  "/api/admin/felhasznalo/:id",
  autentikaciKotelezo,
  adminKell,
  (_req: Request, res: Response) => {
    res.json({ uzenet: "Felhasznalo torolve (szimulallt)" });
  }
);


/* --- 4. Beepitett middleware-ek ---

  Az Express nehany hasznos beepitett middleware-t tartalmaz:
*/

// JSON body parser -- a nyers request body-t JSON-na alakitja
app.use(express.json({ limit: "10kb" })); // Meretkorlattal!

// URL-encoded body parser -- formok adatait kezeli
app.use(express.urlencoded({ extended: true }));

// Statikus fajl kiszolgalo
// app.use(express.static("public"));
// Ez a "public" mappabol szolgalja ki a fajlokat
// Pl. http://localhost:3000/logo.png -> public/logo.png


/* --- 5. Error handling middleware ---

  Az Express hibakezelő middleware-je kulonleges: NEGY parametere van
  (err, req, res, next). Az Express errol ismeri fel, hogy ez
  hibakezelő middleware.

  A hibakezelő middleware-t MINDIG a vegere kell tenni, az osszes
  route utan. Ez kapja el a nem kezelt hibakat.
*/

// Sajat hiba osztaly -- hogy kulobbseget tegyunk a kulonbozo hibak kozott
class ApiHiba extends Error {
  constructor(
    public statusCode: number,
    message: string
  ) {
    super(message);
    this.name = "ApiHiba";
  }
}

// Hibakezelő middleware
function hibaKezelő(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error(`[HIBA] ${err.message}`);

  if (err instanceof ApiHiba) {
    res.status(err.statusCode).json({
      hiba: err.message,
    });
    return;
  }

  // Ismeretlen hiba -- ne kuldd ki a reszleteket production-ben!
  const production = process.env.NODE_ENV === "production";
  res.status(500).json({
    hiba: production ? "Belso szerverhiba" : err.message,
  });
}

// A hibakezelő MINDIG az utolso middleware legyen
app.use(hibaKezelő);


/* --- 6. Middleware sorrend osszefoglalas ---

  A helyes sorrend (fentrol lefele):
  1. Request ID, logging (minden keres elott)
  2. Body parser (json, urlencoded)
  3. CORS, helmet (biztonsagi headerek)
  4. Route-specifikus middleware-ek (autentikacio, jogosultsag)
  5. Route handler-ek
  6. 404 kezelő (ha egyik route sem illeszkedett)
  7. Error handling middleware (a legvegen!)
*/

// 404 kezelő -- ez fut, ha egyik route sem illeszkedett
app.use((_req: Request, res: Response) => {
  res.status(404).json({ hiba: "Az endpoint nem talalhato" });
});


/* --- Osszefoglalas ---

  - A middleware fuggvenyek a keres es a valasz kozott "ulnek"
  - Mindegyik meghivhatja a next()-et (tovabbadas) vagy befejezzheti a valaszt
  - A sorrend kritikus -- rosszul sorrendezett middleware-ek hibas muukodeshez vezetnek
  - Route-specifikus middleware: csak bizonyos route-okra vonatkozik
  - Error handling middleware: 4 parameter (err, req, res, next), mindig utolso
  - A sajat hiba osztaly segit a kulonbozo hibatipusok megkulonbozteteseben

  A kovetkezo fajlban megnezzuk, hogyan tervezzunk REST API-t a bevalt
  konvenciok szerint.
*/

export { app, ApiHiba };
