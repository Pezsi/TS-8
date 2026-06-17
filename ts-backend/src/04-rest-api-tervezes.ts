/*
  REST API tervezes -- hogyan epitsd fel az API-dat?

  A REST (Representational State Transfer) nem egy konkret technologia,
  hanem egy architekturalis stilus -- egy gyujtemeny elv es konvencio,
  ami megmondja, hogyan strukturald a webes API-dat.

  Miert fontos ezt ismerni? Mert ha kovetted a REST konvenciokat, az
  API-d kiszamithato es kovetkezetes lesz. Aki ismeri a REST konvenciokat,
  az a dokumentacio reszletes olvasasa nelkul is ki fogja talalni, hogyan
  mukodik az API-d. Es ez hatalmas ertek.
*/

import express, { Request, Response, Router } from "express";


/* --- 1. REST elvek ---

  A REST legalapvetobb elve az eroforras-alapu gondolkodas.

  Eroforras (resource): barmilyen "dolog", amit az API-n keresztul
  kezelni akarsz. Peldaul: felhasznalo, cikk, rendeles, termek.

  Minden eroforrasnak van egy egyedi cime (URL):
  - /api/felhasznalok         -- a felhasznalok gyujtemenye
  - /api/felhasznalok/42      -- egy konkret felhasznalo (42-es ID)
  - /api/felhasznalok/42/cikkek -- a 42-es felhasznalo cikkei

  A muveleteket a HTTP metodus hatarozza meg:
  - GET    /api/felhasznalok       -- listaz (osszes)
  - GET    /api/felhasznalok/42    -- egy konkret leker
  - POST   /api/felhasznalok       -- ujat letrehoz
  - PUT    /api/felhasznalok/42    -- teljesen felulir
  - PATCH  /api/felhasznalok/42    -- reszben moddosit
  - DELETE /api/felhasznalok/42    -- torol
*/


/* --- 2. URL konvenciok ---

  ROSSZ URL-ek:
  - /api/getFelhasznalok        -- ne tedd az igeet az URL-be, arra a metodus valo
  - /api/Felhasznalo/torlese/42 -- ne keverd a magyart es az igeet
  - /api/user_list              -- ne hasznalj alahuzast

  JO URL-ek:
  - /api/felhasznalok           -- tobbes szam, kisbetus
  - /api/felhasznalok/42        -- ID az URL-ben
  - /api/felhasznalok/42/cikkek -- hierarchikus kapcsolat
*/


/* --- 3. Egy komplett CRUD API megvalositaasa --- */

const router = Router();

// Tipusok
interface Cikk {
  id: number;
  cim: string;
  tartalom: string;
  szerzoId: number;
  letrehozva: string;
  modositva: string;
}

// In-memory adattaar
let kovetkezoId = 1;
const cikkek: Cikk[] = [];

// Segeedfuggvenyek a valasz formaatuumhoz
interface ListaValasz<T> {
  adat: T[];
  meta: {
    osszes: number;
    lap: number;
    lapMeret: number;
    osszesLap: number;
  };
}

function lapozottValasz<T>(
  tomb: T[],
  lap: number,
  lapMeret: number
): ListaValasz<T> {
  const kezdet = (lap - 1) * lapMeret;
  const veg = kezdet + lapMeret;
  const szeletelt = tomb.slice(kezdet, veg);

  return {
    adat: szeletelt,
    meta: {
      osszes: tomb.length,
      lap,
      lapMeret,
      osszesLap: Math.ceil(tomb.length / lapMeret),
    },
  };
}


/* --- GET /api/cikkek -- listazas lapozassal es szuressel --- */

router.get("/", (req: Request, res: Response) => {
  // Query parameterek kezelese
  const lap = Math.max(1, parseInt(req.query.lap as string, 10) || 1);
  const lapMeret = Math.min(100, Math.max(1, parseInt(req.query.meret as string, 10) || 20));

  // Szures
  let szurtCikkek = [...cikkek];
  if (req.query.szerzo) {
    const szerzoId = parseInt(req.query.szerzo as string, 10);
    szurtCikkek = szurtCikkek.filter((c) => c.szerzoId === szerzoId);
  }

  // Rendezzes (egyszeru pelda)
  const rendez = req.query.rendez as string;
  if (rendez === "legujabb") {
    szurtCikkek.sort((a, b) => b.letrehozva.localeCompare(a.letrehozva));
  } else if (rendez === "legregebbi") {
    szurtCikkek.sort((a, b) => a.letrehozva.localeCompare(b.letrehozva));
  }

  const valasz = lapozottValasz(szurtCikkek, lap, lapMeret);
  res.json(valasz);
});


/* --- GET /api/cikkek/:id -- egy cikk lekeerdezese --- */

router.get("/:id", (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);

  if (isNaN(id)) {
    res.status(400).json({ hiba: "Az ID szam legyen" });
    return;
  }

  const cikk = cikkek.find((c) => c.id === id);

  if (!cikk) {
    res.status(404).json({ hiba: "A cikk nem talalhato" });
    return;
  }

  res.json({ adat: cikk });
});


/* --- POST /api/cikkek -- uj cikk letrehozasa --- */

router.post("/", (req: Request, res: Response) => {
  const { cim, tartalom, szerzoId } = req.body;

  // Validacio (kesobb Zod-dal fogju csinalni, itt egyszeru pelda)
  const hibak: string[] = [];
  if (!cim || typeof cim !== "string" || cim.trim().length === 0) {
    hibak.push("A cim megadasa kotelezo");
  }
  if (!tartalom || typeof tartalom !== "string") {
    hibak.push("A tartalom megadasa kotelezo");
  }
  if (!szerzoId || typeof szerzoId !== "number") {
    hibak.push("A szerzoId megadasa kotelezo (szam)");
  }

  if (hibak.length > 0) {
    res.status(400).json({ hiba: "Validacios hiba", reszletek: hibak });
    return;
  }

  const most = new Date().toISOString();
  const ujCikk: Cikk = {
    id: kovetkezoId++,
    cim: cim.trim(),
    tartalom,
    szerzoId,
    letrehozva: most,
    modositva: most,
  };

  cikkek.push(ujCikk);

  // 201 Created + Location header (hol talalhato az uj eroforras)
  res.status(201)
    .header("Location", `/api/cikkek/${ujCikk.id}`)
    .json({ adat: ujCikk });
});


/* --- PUT /api/cikkek/:id -- cikk teljes felulirasa --- */

router.put("/:id", (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  const index = cikkek.findIndex((c) => c.id === id);

  if (index === -1) {
    res.status(404).json({ hiba: "A cikk nem talalhato" });
    return;
  }

  const { cim, tartalom } = req.body;
  if (!cim || !tartalom) {
    res.status(400).json({ hiba: "A cim es a tartalom megadasa kotelezo" });
    return;
  }

  cikkek[index] = {
    ...cikkek[index],
    cim,
    tartalom,
    modositva: new Date().toISOString(),
  };

  res.json({ adat: cikkek[index] });
});


/* --- PATCH /api/cikkek/:id -- cikk resszleges modositasa --- */

// A kulonbseg a PUT es a PATCH kozott:
// PUT: a teljes eroforrasst kuldi a kliens (ami hianyzik, torlodik)
// PATCH: csak a modosithato mezooket kuldi (ami hianyzik, valtozatlan marad)

router.patch("/:id", (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  const index = cikkek.findIndex((c) => c.id === id);

  if (index === -1) {
    res.status(404).json({ hiba: "A cikk nem talalhato" });
    return;
  }

  const { cim, tartalom } = req.body;

  if (cim !== undefined) cikkek[index].cim = cim;
  if (tartalom !== undefined) cikkek[index].tartalom = tartalom;
  cikkek[index].modositva = new Date().toISOString();

  res.json({ adat: cikkek[index] });
});


/* --- DELETE /api/cikkek/:id -- cikk torlese --- */

router.delete("/:id", (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  const index = cikkek.findIndex((c) => c.id === id);

  if (index === -1) {
    res.status(404).json({ hiba: "A cikk nem talalhato" });
    return;
  }

  cikkek.splice(index, 1);
  res.status(204).send();
});


/* --- 4. Hiba valasz formatum ---

  A hibaavalaszok formaatuuma legyen kovetkezetes az egesz API-ban.
  Ajanlott formatum:
*/

interface HibaValasz {
  hiba: string;         // Emberi olvashato hibauzenet
  kod?: string;         // Gepi olvashato hibakod (opcionalis)
  reszletek?: string[]; // Reszletes hibak listaja (validaciohoz)
}

// Pelda hibavalaszok:
// 400: { hiba: "Validacios hiba", reszletek: ["A cim kotelezo", "Az email ervenytelen"] }
// 401: { hiba: "Bejelentkezes szukseges" }
// 403: { hiba: "Nincs jogosultsagod" }
// 404: { hiba: "A cikk nem talalhato" }
// 500: { hiba: "Belso szerverhiba" }


/* --- 5. Router csatlakoztatasa az alkalmazashoz --- */

const app = express();
app.use(express.json());
app.use("/api/cikkek", router);


/* --- Osszefoglalas ---

  - A REST eroforras-alapu: URL-ek dolgokkra mutatnak, metodusok muveleteket vegeznek
  - URL-ek: tobbes szam, kisbetus, hierarchikus (/api/cikkek/42)
  - Lapozas: query parameterek (?lap=2&meret=20)
  - Szures: query parameterek (?szerzo=5)
  - Valasz formatum: kovetkezetes, meta informaciokkal
  - Hibavalaszok: kovetkezetes formatum, megfelelo status code
  - Router: az Express Router segit a route-ok logikus csoportositasaban

  A kovetkezo fajlban az adatbazis kezelest nezzuk meg Prisma-val.
*/

export { app, router };
export type { Cikk, HibaValasz, ListaValasz };
