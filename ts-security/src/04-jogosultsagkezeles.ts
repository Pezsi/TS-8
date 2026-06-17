/*
  Jogosultsagkezeles (Authorization) -- ki mit csinalhat a rendszerben?

  Fontos megkuulonboztetni ket fogalmat, amiket gyakran osszekevernek:

  - Autentikacio (authentication): "Ki vagy te?" -- a felhasznalo
    azonositasa, peldaul jelszoval, tokennel. Errol szolt az elozo fejezet.

  - Authorizacio (authorization): "Mit szabad csinalnod?" -- miutan
    tudjuk, ki a felhasznalo, el kell dontenunk, milyen muveletekhez
    van joga.

  Peldaul: egy sima felhasznalo lathatja a sajat profiljarjat, de nem
  torolhet mas felhasznalokat. Egy admin mindent lat es mindent torolhet.
  Egy moderator torolhet hozzaszolasokat, de nem tud uj adminokat
  kinevezni.

  Ebben a fajlban megnezzuk, hogyan valosisthatjuk meg a role-based
  access control-t (RBAC) TypeScript-ben, tipusbiztosan, Express
  middleware segitsegevel.
*/

import { Request, Response, NextFunction } from "express";


/* --- 1. Szerepek es jogosultsagok definialasa ---

  Az RBAC lenyege, hogy a jogosultsagokat nem kozvetlenul a
  felhasznalokhoz rendeljuk, hanem szerepekhez (role). A felhasznalo
  kap egy vagy tobb szerepet, es a szerep hatarozza meg, mit tehet.

  Miert jo ez? Mert ha hozzza kell adni egy uj jogosultsagot az
  osszes moderatornak, eleg a "moderator" szerephez hozzaadni,
  nem kell minden egyes felhasznalot kulon modositani.
*/

// Eloszor definialjuk a lehetseges jogosultsagokat
// A "as const" garantalja, hogy ezek nem modosithatok futas kozben
const JOGOSULTSAGOK = {
  // Felhasznalok kezelese
  FELHASZNALO_OLVAS: "felhasznalo:olvas",
  FELHASZNALO_LETREHOZ: "felhasznalo:letrehoz",
  FELHASZNALO_MODOSIT: "felhasznalo:modosit",
  FELHASZNALO_TOROL: "felhasznalo:torol",

  // Tartalom kezelese
  CIKK_OLVAS: "cikk:olvas",
  CIKK_IR: "cikk:ir",
  CIKK_MODOSIT: "cikk:modosit",
  CIKK_TOROL: "cikk:torol",

  // Rendszer adminisztracio
  RENDSZER_BEALLITAS: "rendszer:beallitas",
  RENDSZER_NAPLO: "rendszer:naplo",
} as const;

// Tipus a jogosultsagok ertekeihez
type Jogosultsag = (typeof JOGOSULTSAGOK)[keyof typeof JOGOSULTSAGOK];

// Szerepek definialasa -- melyik szerephez milyen jogosultsagok tartoznak
type Szerep = "admin" | "moderator" | "felhasznalo" | "vendeg";

const SZEREP_JOGOSULTSAGOK: Record<Szerep, ReadonlyArray<Jogosultsag>> = {
  admin: [
    JOGOSULTSAGOK.FELHASZNALO_OLVAS,
    JOGOSULTSAGOK.FELHASZNALO_LETREHOZ,
    JOGOSULTSAGOK.FELHASZNALO_MODOSIT,
    JOGOSULTSAGOK.FELHASZNALO_TOROL,
    JOGOSULTSAGOK.CIKK_OLVAS,
    JOGOSULTSAGOK.CIKK_IR,
    JOGOSULTSAGOK.CIKK_MODOSIT,
    JOGOSULTSAGOK.CIKK_TOROL,
    JOGOSULTSAGOK.RENDSZER_BEALLITAS,
    JOGOSULTSAGOK.RENDSZER_NAPLO,
  ],
  moderator: [
    JOGOSULTSAGOK.FELHASZNALO_OLVAS,
    JOGOSULTSAGOK.CIKK_OLVAS,
    JOGOSULTSAGOK.CIKK_IR,
    JOGOSULTSAGOK.CIKK_MODOSIT,
    JOGOSULTSAGOK.CIKK_TOROL,
  ],
  felhasznalo: [
    JOGOSULTSAGOK.FELHASZNALO_OLVAS,
    JOGOSULTSAGOK.CIKK_OLVAS,
    JOGOSULTSAGOK.CIKK_IR,
  ],
  vendeg: [
    JOGOSULTSAGOK.CIKK_OLVAS,
  ],
};


/* --- 2. Jogosultsag-ellenorzo fuggvenyek ---

  Ezeket a fuggvenyeket hasznalhatjuk barhol a kodunkban, hogy
  ellenorizzuk, van-e a felhasznalonak joga egy adott muvelethez.
*/

function vanJogosultsaga(szerep: Szerep, jogosultsag: Jogosultsag): boolean {
  const szerepJogok = SZEREP_JOGOSULTSAGOK[szerep];
  return szerepJogok.includes(jogosultsag);
}

function vanBarmelyikJogosultsaga(
  szerep: Szerep,
  jogosultsagok: Jogosultsag[]
): boolean {
  return jogosultsagok.some((j) => vanJogosultsaga(szerep, j));
}

function vanMindenJogosultsaga(
  szerep: Szerep,
  jogosultsagok: Jogosultsag[]
): boolean {
  return jogosultsagok.every((j) => vanJogosultsaga(szerep, j));
}

// Pelda:
console.log("Admin torolhet felhasznalot?",
  vanJogosultsaga("admin", JOGOSULTSAGOK.FELHASZNALO_TOROL)); // true

console.log("Sima felhasznalo torolhet felhasznalot?",
  vanJogosultsaga("felhasznalo", JOGOSULTSAGOK.FELHASZNALO_TOROL)); // false


/* --- 3. Express middleware az authorizaciohoz ---

  A middleware pattern az Express egyik legerosebb koncepcioja. A
  middleware egy fuggveny, ami a request es response kozott ul, es
  eldontheti, hogy a kerelem tovabbmehet-e a kovetkezo lepesbe.

  Az authorizacios middleware ellenorzi, hogy a bejelentkezett
  felhasznalonak van-e joga az adott muvelethez. Ha nincs, 403
  Forbidden valaszt kuld vissza.
*/

// Kiegeszitjuk a Request tipust a felhasznalo adataival
// Ezt a tipusbiztonsag miatt tesszuk -- igy a fordito tudja,
// hogy a req.felhasznalo mezo letezik
interface AuthRequest extends Request {
  felhasznalo?: {
    id: number;
    email: string;
    szerep: Szerep;
  };
}

// Middleware: ellenorzi, hogy a felhasznalo be van-e jelentkezve
function hitelesitesKotelezo(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  // Egy valos alkalmazasban itt a JWT tokent ellenoriznank
  // (lasd az elozo fejezetet). Most egyszerusitjuk:
  if (!req.felhasznalo) {
    res.status(401).json({
      hiba: "Bejelentkezes szukseges",
    });
    return;
  }
  next();
}

// Middleware gyarto fuggveny: ellenorzi a jogosultsagot
// Ez egy "higher-order function" -- egy fuggveny, ami fuggvenyt ad vissza.
// Azert hasznos, mert parameterezheto: megadhatod, milyen jogosultsag kell.
function jogosultsagKell(
  ...szuksegesJogok: Jogosultsag[]
): (req: AuthRequest, res: Response, next: NextFunction) => void {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.felhasznalo) {
      res.status(401).json({ hiba: "Bejelentkezes szukseges" });
      return;
    }

    const vanJoga = vanMindenJogosultsaga(
      req.felhasznalo.szerep,
      szuksegesJogok
    );

    if (!vanJoga) {
      // Fontos: ne mond el, MILYEN jogosultsag hianyzik.
      // Ez informaciot adna a tamadoknak a rendszer belso szerkezeterol.
      res.status(403).json({
        hiba: "Nincs jogosultsagod ehhez a muvelethez",
      });
      return;
    }

    next();
  };
}

// Middleware: csak adott szerepek ferhetnek hozza
function szerepKell(
  ...engedelyezettSzerepek: Szerep[]
): (req: AuthRequest, res: Response, next: NextFunction) => void {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.felhasznalo) {
      res.status(401).json({ hiba: "Bejelentkezes szukseges" });
      return;
    }

    if (!engedelyezettSzerepek.includes(req.felhasznalo.szerep)) {
      res.status(403).json({
        hiba: "Nincs jogosultsagod ehhez a muvelethez",
      });
      return;
    }

    next();
  };
}


/* --- 4. Hasznalat a route-okban ---

  Lent lathato, hogyan alkalmazzuk a middleware-eket egy valos
  Express alkalmazasban. Minden route elott megadhatjuk, milyen
  jogosultsag szukseges.
*/

// Pelda route-ok (Express app nelkul, demonstracios celbol):
//
// A felhasznalok listazasahoz eleg az olvvasasi jog:
// app.get("/api/felhasznalok",
//   hitelesitesKotelezo,
//   jogosultsagKell(JOGOSULTSAGOK.FELHASZNALO_OLVAS),
//   felhasznaloController.listaz
// );
//
// Felhasznalo torlesehez torlesi jog kell:
// app.delete("/api/felhasznalok/:id",
//   hitelesitesKotelezo,
//   jogosultsagKell(JOGOSULTSAGOK.FELHASZNALO_TOROL),
//   felhasznaloController.torol
// );
//
// A rendszer beallitasokhoz csak admin ferhet hozza:
// app.put("/api/beallitasok",
//   hitelesitesKotelezo,
//   szerepKell("admin"),
//   beallitasController.frissit
// );


/* --- 5. Erdekes biztonsagi szempont: sajat adat vedelme ---

  Nem eleg a szerepeket ellenorizni. Egy sima felhasznalonak joga
  van a sajat profilja modositasahoz, de NEM modosithatja masvalaki
  profiljaaat. Ezt kulon kell kezelni.
*/

function sajatAdatVagyAdmin(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  if (!req.felhasznalo) {
    res.status(401).json({ hiba: "Bejelentkezes szukseges" });
    return;
  }

  const kertId = parseInt(req.params.id, 10);
  const sajatId = req.felhasznalo.id;
  const adminE = req.felhasznalo.szerep === "admin";

  if (kertId !== sajatId && !adminE) {
    res.status(403).json({
      hiba: "Csak a sajat adataidat modosithatod",
    });
    return;
  }

  next();
}

// Hasznalat:
// app.put("/api/felhasznalok/:id",
//   hitelesitesKotelezo,
//   sajatAdatVagyAdmin,
//   felhasznaloController.modosit
// );


/* --- Osszefoglalas ---

  - Az authorizacio es az autentikacio ket kulon dolog -- ne keverd ossze
  - Hasznalj RBAC-ot: jogosultsagokat szerepekhez rendeld, ne felhasznalokhoz
  - A jogosultsagokat tipusbiztosan definiald (const assertion, union type)
  - Middleware-eket hasznalj az Express-ben az ellenorzeshez
  - A hibauzenetek ne aruljaanak el rendszerbeli reszleteket
  - A sajat adat kezeleseere kulon logika kell (nem eleg a szerep)

  A kovetkezo fajlban megnezzuk az API biztonsag szeles temat:
  helmet, rate limiting, CORS es HTTP headerek.
*/

export {
  JOGOSULTSAGOK,
  SZEREP_JOGOSULTSAGOK,
  vanJogosultsaga,
  jogosultsagKell,
  szerepKell,
  hitelesitesKotelezo,
  sajatAdatVagyAdmin,
};
export type { Szerep, Jogosultsag, AuthRequest };
