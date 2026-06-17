/*
  Authentikacio -- bejelentkezes es munkamenet kezeles

  Az authentikacio ("ki vagy te?") a legtobb backend alkalmazas
  alapveto resze. Ebben a fajlban megnezzuk a ket fo megkozelitesst:
  a session alapu es a token (JWT) allapu autentikacioot, es
  megvalositunk egy komplett login/register flow-t.
*/

import { Request, Response, NextFunction, Router } from "express";
import { z } from "zod";


/* --- 1. Session vs Token alapu autentikacio ---

  Session alapu:
  A szerver tarolja a felhasznalo munkamenet-adatait (memoriaaban,
  adatbazisban, vagy Redis-ben). A kliens egy session ID-t kap sutiban,
  es minden keresnel ezt kuldi el. A szerver a session ID alapjan
  azonositja a felhasznalot.

  Elony: egyszeru, biztonsagos (a szerver kontrollalja az allapotot).
  Hatrany: allam fuggoseg (stateful) -- nehezebb skaalazni tobb
  szerver eseten.

  Token (JWT) alapu:
  A szerver generaal egy alaairt tokent, ami tartalmazza a felhasznalo
  azonositoját es szerepet. A kliens taroolja a tokent es minden
  keresnel elkuldi. A szerver az alairassal ellenorzi az ervenyesseget.

  Elony: allapotmentes (stateless) -- barmely szerver tudja ellenorizni.
  Hatrany: a tokent nem lehet egyszeruen visszavonni (nincs "kijelentkezes"
  a szerveren -- a token a lejarataig ervenyes marad).

  A gyakorlatban: a modern API-k tobbsege JWT-t hasznal, a hagyomanyos
  webalkalmazasok session-t. Mindkettonek van helye.
*/


/* --- 2. JWT implementacio --- */

// Szimulalt bcrypt es jwt (a valosagban npm csomagokat hasznalj)
// import bcrypt from "bcrypt";
// import jwt from "jsonwebtoken";

// Demonstracios tipusok
interface TokenPayload {
  felhasznaloId: number;
  szerep: string;
}

interface TaroltFelhasznalo {
  id: number;
  email: string;
  nev: string;
  jelszoHash: string;
  szerep: string;
}

// Szimulalt adatbazis
const felhasznalok: TaroltFelhasznalo[] = [];

// Konfiguracio (a valosagban kornyezeti valtozokbol jon)
const AUTH_CONFIG = {
  jwtSecret: "KORNYEZETI_VALTOZOOBOL_KELLENE_JONNIE_MINIMUM_32_KARAKTER",
  accessTokenLejaratPerc: 15,
  refreshTokenLejaratNap: 7,
  saltRounds: 12,
};


/* --- 3. Regisztracio --- */

const RegisztracioSchema = z.object({
  nev: z.string().min(2).max(100).trim(),
  email: z.string().email().toLowerCase().trim(),
  jelszo: z
    .string()
    .min(8, "A jelszo legalabb 8 karakter")
    .regex(/[A-Z]/, "Legalabb egy nagybetu")
    .regex(/[0-9]/, "Legalabb egy szam")
    .regex(/[^a-zA-Z0-9]/, "Legalabb egy specialis karakter"),
  jelszoMegerosites: z.string(),
}).refine(
  (adat) => adat.jelszo === adat.jelszoMegerosites,
  { message: "A ket jelszo nem egyezik", path: ["jelszoMegerosites"] }
);

async function regisztracio(
  adat: z.infer<typeof RegisztracioSchema>
): Promise<{ sikeres: boolean; uzenet: string; felhasznaloId?: number }> {
  // Ellenorizzuk, hogy az email meg nincs regisztralva
  const letezik = felhasznalok.some((f) => f.email === adat.email);
  if (letezik) {
    return { sikeres: false, uzenet: "Ez az email cim mar foglalt" };
  }

  // Jelszo hashelese
  // const jelszoHash = await bcrypt.hash(adat.jelszo, AUTH_CONFIG.saltRounds);
  const jelszoHash = `hashed_${adat.jelszo}`; // Szimulalt hash

  const ujFelhasznalo: TaroltFelhasznalo = {
    id: felhasznalok.length + 1,
    email: adat.email,
    nev: adat.nev,
    jelszoHash,
    szerep: "felhasznalo",
  };

  felhasznalok.push(ujFelhasznalo);

  return {
    sikeres: true,
    uzenet: "Sikeres regisztracio",
    felhasznaloId: ujFelhasznalo.id,
  };
}


/* --- 4. Bejelentkezes --- */

const LoginSchema = z.object({
  email: z.string().email().toLowerCase().trim(),
  jelszo: z.string().min(1, "A jelszo megadasa kotelezo"),
});

interface LoginValasz {
  accessToken: string;
  refreshToken: string;
  felhasznalo: {
    id: number;
    nev: string;
    email: string;
    szerep: string;
  };
}

async function bejelentkezes(
  adat: z.infer<typeof LoginSchema>
): Promise<LoginValasz | null> {
  const felhasznalo = felhasznalok.find((f) => f.email === adat.email);

  // FONTOS: ne aruld el, hogy a felhasznalo nem letezik-e vagy a jelszo rossz-e!
  // Mindig ugyanaz az uzenet: "Hibas email vagy jelszo"
  if (!felhasznalo) {
    return null;
  }

  // Jelszo ellenorzes
  // const jelszoHelyes = await bcrypt.compare(adat.jelszo, felhasznalo.jelszoHash);
  const jelszoHelyes = felhasznalo.jelszoHash === `hashed_${adat.jelszo}`; // Szimulalt

  if (!jelszoHelyes) {
    return null;
  }

  // Access token generalas
  // const accessToken = jwt.sign(
  //   { felhasznaloId: felhasznalo.id, szerep: felhasznalo.szerep },
  //   AUTH_CONFIG.jwtSecret,
  //   { expiresIn: `${AUTH_CONFIG.accessTokenLejaratPerc}m` }
  // );
  const accessToken = `access_${felhasznalo.id}_${Date.now()}`; // Szimulalt

  // Refresh token generalas
  // const refreshToken = jwt.sign(
  //   { felhasznaloId: felhasznalo.id, tipus: "refresh" },
  //   AUTH_CONFIG.jwtSecret,
  //   { expiresIn: `${AUTH_CONFIG.refreshTokenLejaratNap}d` }
  // );
  const refreshToken = `refresh_${felhasznalo.id}_${Date.now()}`; // Szimulalt

  return {
    accessToken,
    refreshToken,
    felhasznalo: {
      id: felhasznalo.id,
      nev: felhasznalo.nev,
      email: felhasznalo.email,
      szerep: felhasznalo.szerep,
    },
  };
}


/* --- 5. Auth middleware -- vedett route-ok --- */

interface AuthRequest extends Request {
  felhasznalo?: TokenPayload;
}

function authMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ hiba: "Bejelentkezes szukseges" });
    return;
  }

  const token = authHeader.replace("Bearer ", "");

  try {
    // const dekodolt = jwt.verify(token, AUTH_CONFIG.jwtSecret) as TokenPayload;
    // req.felhasznalo = dekodolt;

    // Szimulalt token dekodolas
    const reszek = token.split("_");
    if (reszek.length < 2) {
      throw new Error("Ervenytelen token");
    }
    req.felhasznalo = {
      felhasznaloId: parseInt(reszek[1], 10),
      szerep: "felhasznalo",
    };

    next();
  } catch {
    res.status(401).json({ hiba: "Ervenytelen vagy lejart token" });
  }
}


/* --- 6. Refresh token koncepccio ---

  Miert van ket token (access + refresh)?

  Az access token rovid eletiddju (15 perc). Ha ellopjak, a tamado
  csak rovid ideig hasznnalhatja. De 15 percenkent ujra bejelentkezni
  kelljen? Nem -- erre valo a refresh token.

  A refresh token hosszabb eletidju (napok/hetek), de csak arra
  hasznalhato, hogy uj access tokent generaaljon. A refresh tokent
  biztonosagosabban tarolhatod (httpOnly cookie), es ha kompromittaloodik,
  a szerveren visszavonhato (blacklist).

  Flow:
  1. Login -> kapsz access token + refresh token
  2. API hivasok az access tokennel
  3. Access token lejar -> kuldd el a refresh tokent a /refresh endpointra
  4. Kapsz uj access tokent (es esetleg uj refresh tokent)
  5. Ha a refresh token is lejar -> ujra be kell jelentkezni
*/

async function frissitsdATokent(
  refreshToken: string
): Promise<{ accessToken: string } | null> {
  try {
    // const dekodolt = jwt.verify(refreshToken, AUTH_CONFIG.jwtSecret);
    // if (dekodolt.tipus !== "refresh") return null;

    // Ellenorizd, hogy a refresh token nincs blacklist-en
    // (adatbazisban tarolt visszavont tokenek)

    // Generaalj uj access tokent
    // const ujAccessToken = jwt.sign(...);

    const ujAccessToken = `access_refreshed_${Date.now()}`;
    return { accessToken: ujAccessToken };
  } catch {
    return null;
  }
}


/* --- 7. Route-ok osszaallitasa --- */

const router = Router();

router.post("/regisztracio", async (req: Request, res: Response) => {
  const eredmeny = RegisztracioSchema.safeParse(req.body);
  if (!eredmeny.success) {
    res.status(400).json({
      hiba: "Validacios hiba",
      reszletek: eredmeny.error.errors.map((h) => h.message),
    });
    return;
  }

  const valasz = await regisztracio(eredmeny.data);
  if (!valasz.sikeres) {
    res.status(409).json({ hiba: valasz.uzenet });
    return;
  }

  res.status(201).json({ uzenet: valasz.uzenet });
});

router.post("/login", async (req: Request, res: Response) => {
  const eredmeny = LoginSchema.safeParse(req.body);
  if (!eredmeny.success) {
    res.status(400).json({ hiba: "Hibas email vagy jelszo" });
    return;
  }

  const valasz = await bejelentkezes(eredmeny.data);
  if (!valasz) {
    res.status(401).json({ hiba: "Hibas email vagy jelszo" });
    return;
  }

  res.json({ adat: valasz });
});

// Vedett endpoint pelda
router.get("/profil", authMiddleware, (req: AuthRequest, res: Response) => {
  res.json({
    uzenet: "Ez a te profilod",
    felhasznaloId: req.felhasznalo?.felhasznaloId,
  });
});


/* --- Osszefoglalas ---

  - Session: allapotfuggoo, egyszeru, hagyomanyos webalkalmazasokhoz
  - JWT: allapotmentes, modern API-khoz, jool skaalazodik
  - Jelszoot MINDIG hashelj bcrypt-tel
  - A login hiba ne arulja el, mi volt pontosan rossz
  - Access token: rovid eletiddju (15 perc), API hivasokhoz
  - Refresh token: hosszabb eletiddju, uj access tokenek generaalsahoz
  - Auth middleware: ellenorizzi a tokent, a route handler elott fut

  A kovetkezo fajlban a projekt strukturaat nezzuk meg: hogyan szervezd
  a kodot egy valos alkalmazasban.
*/

export {
  router as authRouter,
  authMiddleware,
  regisztracio,
  bejelentkezes,
};
export type { AuthRequest, TokenPayload };
