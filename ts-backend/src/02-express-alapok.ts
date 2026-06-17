/*
  Express alapok -- az elso szerver

  Az Express a Node.js vilag legelterjedtebb web keretrendszere. Szinte
  minden Node.js backend tutorial Express-szel indul, es jo okkal:
  egyszeru, rugalmas, es hatalmas okoszisztemaja van.

  De mielott beleugrunk az Express-be, erdemes nagyon roviden attekinteni
  a HTTP alapjait, mert az Express lenyegeben egy HTTP szerver, ami
  kereseket fogad es valaszokat kuld.
*/

import express, { Request, Response } from "express";


/* --- 1. HTTP alapok -- nagyon roviden ---

  A HTTP (HyperText Transfer Protocol) a web kommunikacios nyelve.
  Minden webes interakcio HTTP keresekbol es valaszokbol all.

  Egy HTTP keres fo reszei:
  - Method (metodus): MIT szeretnel csinalni?
    GET     -- adatot kerni (pl. felhasznalok listaja)
    POST    -- uj adatot letrehozni (pl. uj felhasznalo)
    PUT     -- meglevo adatot teljesen felulirni
    PATCH   -- meglevo adatot reszben modositani
    DELETE  -- adatot torolni

  - URL: HOL? Melyik eroforras?
    /api/felhasznalok          -- osszes felhasznalo
    /api/felhasznalok/42       -- a 42-es ID-ju felhasznalo
    /api/felhasznalok/42/cikkek -- a 42-es felhasznalo cikkei

  - Headers: META informaciok (content type, auth token, stb.)
  - Body: az adatok (POST/PUT/PATCH eseten)

  Egy HTTP valasz fo reszei:
  - Status code: mi tortent?
    200 -- OK (minden rendben)
    201 -- Created (sikeresen letrejott)
    204 -- No Content (siker, de nincs mit visszaadni)
    400 -- Bad Request (hibas kerelem)
    401 -- Unauthorized (nem vagy bejelentkezve)
    403 -- Forbidden (nincs jogod)
    404 -- Not Found (nem talalhato)
    500 -- Internal Server Error (szerverhiba)

  - Headers: META informaciok
  - Body: a valasz adat (altalaban JSON)
*/


/* --- 2. Az elso Express szerver ---

  Hozzunk letre egy egyszeru Express szervert. Ez az abszolut minimum:
  egy szerver, ami egyetlen endpointon valaszol.
*/

const app = express();
const PORT = 3000;

// A JSON body parser middleware -- nelkule a req.body undefined lenne
// Ez mondja meg az Express-nek, hogy a beerkezo JSON tartalmat
// automatikusan parse-olja es a req.body-ba tegye.
app.use(express.json());

// Az elso route: GET /
// Amikor valaki a bongeszoben megnyitja a http://localhost:3000/ cimet,
// ez a fuggveny fut le.
app.get("/", (_req: Request, res: Response) => {
  res.json({ uzenet: "Udvozollek az API-ban!" });
});


/* --- 3. Route-ok definiaalasa ---

  Az Express-ben minden route egy HTTP metodus + URL minta paros.
  A route definialasnal megadod, milyen keresekre hogyan reagaaljon
  a szerver.
*/

// In-memory "adatbazis" -- kesobb valos adatbazist fogunk hasznalni
interface Felhasznalo {
  id: number;
  nev: string;
  email: string;
}

let kovetkezoId = 1;
const felhasznalok: Felhasznalo[] = [];

// GET /api/felhasznalok -- osszes felhasznalo listazasa
app.get("/api/felhasznalok", (_req: Request, res: Response) => {
  res.json(felhasznalok);
});

// GET /api/felhasznalok/:id -- egy konkret felhasznalo lekerdezese
// A ":id" egy route parameter -- barmilyen ertek johet ide
app.get("/api/felhasznalok/:id", (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);

  // Ellenorizzuk, hogy a param szam-e
  if (isNaN(id)) {
    res.status(400).json({ hiba: "Az ID szam legyen" });
    return;
  }

  const felhasznalo = felhasznalok.find((f) => f.id === id);

  if (!felhasznalo) {
    res.status(404).json({ hiba: "A felhasznalo nem talalhato" });
    return;
  }

  res.json(felhasznalo);
});

// POST /api/felhasznalok -- uj felhasznalo letrehozasa
app.post("/api/felhasznalok", (req: Request, res: Response) => {
  const { nev, email } = req.body;

  // Egyszeru validacio (kesobb Zod-dal fogjuk csinalni)
  if (!nev || typeof nev !== "string") {
    res.status(400).json({ hiba: "A nev megadasa kotelezo" });
    return;
  }

  if (!email || typeof email !== "string") {
    res.status(400).json({ hiba: "Az email megadasa kotelezo" });
    return;
  }

  const ujFelhasznalo: Felhasznalo = {
    id: kovetkezoId++,
    nev,
    email,
  };

  felhasznalok.push(ujFelhasznalo);

  // 201 Created -- jelezzuk, hogy sikeresen letrejott az eroforras
  res.status(201).json(ujFelhasznalo);
});

// PUT /api/felhasznalok/:id -- felhasznalo teljes felulirasa
app.put("/api/felhasznalok/:id", (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  const index = felhasznalok.findIndex((f) => f.id === id);

  if (index === -1) {
    res.status(404).json({ hiba: "A felhasznalo nem talalhato" });
    return;
  }

  const { nev, email } = req.body;
  if (!nev || !email) {
    res.status(400).json({ hiba: "A nev es az email megadasa kotelezo" });
    return;
  }

  felhasznalok[index] = { id, nev, email };
  res.json(felhasznalok[index]);
});

// DELETE /api/felhasznalok/:id -- felhasznalo torlese
app.delete("/api/felhasznalok/:id", (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  const index = felhasznalok.findIndex((f) => f.id === id);

  if (index === -1) {
    res.status(404).json({ hiba: "A felhasznalo nem talalhato" });
    return;
  }

  felhasznalok.splice(index, 1);

  // 204 No Content -- sikeres torles, nincs mit visszaadni
  res.status(204).send();
});


/* --- 4. Request es Response reszletesebben ---

  Nezzuk meg, mit tartalmaz a req (request) es a res (response) objektum:
*/

// Pelda: a request kulonbozo reszei
app.get("/api/pelda/:kategoria", (req: Request, res: Response) => {
  // URL parameter -- az URL reszekeent definialt, pl. /api/pelda/elektronika
  const kategoria = req.params.kategoria;

  // Query parameter -- a ? utan, pl. /api/pelda/elektronika?rendez=ar&lap=2
  const rendez = req.query.rendez;       // "ar"
  const lap = req.query.lap;             // "2"

  // Headerek
  const contentType = req.get("Content-Type");
  const authToken = req.get("Authorization");

  // Body (POST/PUT eseten)
  const body = req.body;

  res.json({
    params: { kategoria },
    query: { rendez, lap },
    headers: { contentType },
    body,
  });
});


/* --- 5. Tipusbiztos request es response ---

  Az Express tipusdefinicioi lehetove teszik, hogy tipusokat adj meg
  a req.params, req.body es res.json szamara. Ez a TypeScript egyik
  nagy elonye Express-szel.
*/

interface FelhasznaloParams {
  id: string; // A route parameterek mindig stringek!
}

interface FelhasznaloBody {
  nev: string;
  email: string;
}

// Tipusos route handler
app.patch(
  "/api/felhasznalok/:id",
  (req: Request<FelhasznaloParams, unknown, Partial<FelhasznaloBody>>, res: Response) => {
    const id = parseInt(req.params.id, 10); // req.params.id tipusa: string
    const { nev, email } = req.body;         // req.body tipusa: Partial<FelhasznaloBody>

    const felhasznalo = felhasznalok.find((f) => f.id === id);
    if (!felhasznalo) {
      res.status(404).json({ hiba: "Nem talalhato" });
      return;
    }

    if (nev) felhasznalo.nev = nev;
    if (email) felhasznalo.email = email;

    res.json(felhasznalo);
  }
);


/* --- 6. A szerver indittaasa --- */

app.listen(PORT, () => {
  console.log(`A szerver fut: http://localhost:${PORT}`);
  console.log("Probald ki:");
  console.log(`  GET  http://localhost:${PORT}/api/felhasznalok`);
  console.log(`  POST http://localhost:${PORT}/api/felhasznalok`);
});


/* --- Osszefoglalas ---

  - Az Express HTTP kereseket fogad es valaszokat kuld
  - A route-ok HTTP metodus + URL minta parosok
  - A req objektum tartalmazza a kerest (params, query, body, headers)
  - A res objektum a valasz kuldeesehez hasznalos (json, status, send)
  - Status code-okat hasznalj a valasz jelleegenek jelzesere
  - TypeScript tipusokkal tipusbiztossa teheted a request/response kezelest

  A kovetkezo fajlban megnezzuk a middleware rendszert, ami az Express
  egyik legerosebb konceepcioja.
*/

export { app };
