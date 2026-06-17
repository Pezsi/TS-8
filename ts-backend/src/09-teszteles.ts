/*
  Teszteles -- miert es hogyan teszteljunk?

  A teszteles az a tevekenyseg, amit a legtobb fejleszto fontosnak tart,
  de a legkevesbe szeret csinalni. Es megis, amikor egyszer megirod
  a teszteket es megmentenek egy production bugtoool, rongtoen megszreted.

  Miert erdemes tesztelni?
  - Mert a "kiprobalom a bongeszoben" nem skalazodik. Ahogy no a kod,
    lehetetlen kezzzel minden esetet vegigellenorizni.
  - Mert a tesztek dokumentaciokent is szolgaalnak: megmutatjak, mit
    csinal a kod es hogyan kell hasznalni.
  - Mert orommel refaktoralhaatsz, ha a tesztek mondjak meg, hogy
    nem tortel el semmit.
  - Mert a CI/CD pipeline automatikusan futtatja oket, igy a hibas
    kod nem jut ki production-be.
*/


/* --- 1. Teszteles tipusai ---

  Unit test (egyseg teszt):
  Egyetlen fuggvenyt vagy osztaalyt tesztel, izolaltan. A fuggoseegeket
  mock-olod (hamisitod), hogy csak a tesztelt egyseg viselkedeseeet merd.
  Gyors, konnyen irhato, de nem garantalja, hogy az egysegek egyutt
  is jool mukodnek.

  Integration test (integracios teszt):
  Tobb egyseget tesztel egyutt, valos (vagy valos-szeru) kornyezetben.
  Peldaul: a controller + service + adatbazis egyuttese. Lassabb, de
  biztosabb kepet ad arrol, hogy a rendszer egyuttesen mukodik-e.

  End-to-end test (e2e teszt):
  A teljes rendszert teszteli, a klienstol a szerveren at az adatbazisig.
  A leglassabb, de a legreaalissabb. Altalaban kevesebb e2e tesztet irsz.

  A gyakorlatban a tesztpiramis ajanlott arany:
  - Sok unit test (gyors, olcso)
  - Kevesebb integration test (kozepes sebesseg)
  - Meeg kevesebb e2e test (lassu, draga)
*/


/* --- 2. Jest/Vitest alapok ---

  A Jest es a Vitest a ket legnepszerubb test framework a Node.js/TS
  vilagban. A szintaxisuk szinte azonos, igy baarmelyikkel dolgozol,
  a tudas atvihetoo. A Vitest modernebb es gyorsabb (ESM tamogatas,
  jobb TypeScript integracio), a Jest elterjedtebb.

  Telepites (Jest + TypeScript):
  npm install -D jest @types/jest ts-jest
*/

// --- Egyszeru unit test pelda ---

// Ez a fuggveny, amit tesztelni akarunk:
function szamoldKiAKedvezmenytBE(
  ar: number,
  kedvezmenySzazalek: number
): number {
  if (ar < 0) throw new Error("Az ar nem lehet negativ");
  if (kedvezmenySzazalek < 0 || kedvezmenySzazalek > 100) {
    throw new Error("A kedvezmeny 0 es 100 kozott legyen");
  }
  return Math.round(ar * (1 - kedvezmenySzazalek / 100));
}

// A teszt fajl (szamolas.test.ts) igy nezne ki:
//
// describe("szamoldKiAKedvezmenyt", () => {
//
//   test("0% kedvezmeny eseten az eredeti arat adja vissza", () => {
//     expect(szamoldKiAKedvezmenyt(1000, 0)).toBe(1000);
//   });
//
//   test("50% kedvezmeny eseten a felet adja vissza", () => {
//     expect(szamoldKiAKedvezmenyt(1000, 50)).toBe(500);
//   });
//
//   test("100% kedvezmeny eseten 0-t ad vissza", () => {
//     expect(szamoldKiAKedvezmenyt(1000, 100)).toBe(0);
//   });
//
//   test("kerekiti az eredmenyt", () => {
//     expect(szamoldKiAKedvezmenyt(999, 33)).toBe(669);
//   });
//
//   test("negativ ar eseten hibat dob", () => {
//     expect(() => szamoldKiAKedvezmenyt(-100, 10)).toThrow("nem lehet negativ");
//   });
//
//   test("ervenytelen kedvezmeny eseten hibat dob", () => {
//     expect(() => szamoldKiAKedvezmenyt(1000, 150)).toThrow("0 es 100 kozott");
//   });
// });


/* --- 3. API endpoint teszteles supertest-tel ---

  A supertest konyvtar lehetove teszi, hogy az Express alkalmazasodat
  HTTP keresekkel teszteld anelkul, hogy tenylegesen elindtitanad a
  szervert egy porton.
*/

// Eloszor szetvalasztjuk az app-ot es a szerver indlitasst:

// app.ts:
import express from "express";

function createApp() {
  const app = express();
  app.use(express.json());

  interface Item { id: number; nev: string; }
  const items: Item[] = [];
  let nextId = 1;

  app.get("/api/items", (_req, res) => {
    res.json(items);
  });

  app.post("/api/items", (req, res) => {
    const { nev } = req.body;
    if (!nev || typeof nev !== "string") {
      res.status(400).json({ hiba: "A nev kotelezo" });
      return;
    }
    const ujItem: Item = { id: nextId++, nev };
    items.push(ujItem);
    res.status(201).json(ujItem);
  });

  return app;
}

// A teszt fajl (app.test.ts):
//
// import request from "supertest";
// import { createApp } from "./app";
//
// describe("Items API", () => {
//   let app: Express;
//
//   beforeEach(() => {
//     // Minden teszt elott friss alkalmazas (ures adatokkal)
//     app = createApp();
//   });
//
//   describe("GET /api/items", () => {
//     test("ures tombot ad vissza ha nincs adat", async () => {
//       const valasz = await request(app).get("/api/items");
//       expect(valasz.status).toBe(200);
//       expect(valasz.body).toEqual([]);
//     });
//   });
//
//   describe("POST /api/items", () => {
//     test("sikeresen letrehoz egy elemet", async () => {
//       const valasz = await request(app)
//         .post("/api/items")
//         .send({ nev: "Teszt elem" })
//         .set("Content-Type", "application/json");
//
//       expect(valasz.status).toBe(201);
//       expect(valasz.body.nev).toBe("Teszt elem");
//       expect(valasz.body.id).toBeDefined();
//     });
//
//     test("400-at ad vissza ha nincs nev", async () => {
//       const valasz = await request(app)
//         .post("/api/items")
//         .send({});
//
//       expect(valasz.status).toBe(400);
//       expect(valasz.body.hiba).toBeDefined();
//     });
//   });
// });


/* --- 4. Mock-olas alapjai ---

  A mock-olas azt jelenti, hogy egy fuggveny vagy modul viselkedeset
  "hamisiitod" a teszt idejeere. Miert? Mert:
  - Nem akarsz valos adatbazist hasznalni unit tesztben
  - Nem akarsz valos emailt kuldeni tesztbol
  - Nem akarsz kulso API-t hivni (lassu, nem megbizhato)
*/

// Pelda: service teszteles mock repository-val

// class FelhasznaloService {
//   constructor(private repo: FelhasznaloRepository) {}
//   async findById(id: number) { ... }
// }

// A teszt:
//
// describe("FelhasznaloService", () => {
//   test("null-t ad vissza ha a felhasznalo nem letezik", async () => {
//     // Mock repository -- hamis valaszt ad
//     const mockRepo = {
//       findById: jest.fn().mockResolvedValue(null),
//       findByEmail: jest.fn(),
//       create: jest.fn(),
//       update: jest.fn(),
//       delete: jest.fn(),
//     };
//
//     const service = new FelhasznaloService(mockRepo as any);
//
//     // Elvarjuk, hogy hibat dobjon, mert a felhasznalo nem letezik
//     await expect(service.profilLekerdezese(999)).rejects.toThrow("nem talalhato");
//
//     // Ellenorizzuk, hogy a repository-t meghivta a helyes parameterrel
//     expect(mockRepo.findById).toHaveBeenCalledWith(999);
//   });
// });


/* --- 5. Mikor mit teszteljunk? ---

  Gyakorlati utmutato:

  MINDIG teszteld:
  - Uzleti logika (service reteg) -- ez a legfontosabb
  - Validacios szabalyok -- hibas bemenet hibas valaszt adjon
  - Szelhatas esetek -- 0, negativ szam, ures string, null, tul hosszu string

  ERDEMES tesztelni:
  - API endpoint-ok (integration test supertest-tel)
  - Komplex adatbazis lekerdezesek
  - Autentikaacios es authorizacios flow

  NEM ERDEMES tesztelni:
  - Trivialis getter/setter fuggvenyeket
  - A keretrendszer sajat mukodeset (az Express mar le van tesztelve)
  - Egyszeru konfiguracioss objektumokat
*/


/* --- 6. Tesztek futtatasa --- */

// package.json scripts:
// "test": "jest",
// "test:watch": "jest --watch",
// "test:coverage": "jest --coverage"

// Jest konfiguracio TypeScript-hez (jest.config.ts):
const jestConfig = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/src", "<rootDir>/tests"],
  testMatch: ["**/*.test.ts"],
  moduleFileExtensions: ["ts", "js", "json"],
  collectCoverageFrom: [
    "src/**/*.ts",
    "!src/**/*.d.ts",
  ],
};


/* --- Osszefoglalas ---

  - A teszteles nem luxus, hanem a megbizhato szoftverfejlesztes alapja
  - Unit test: izolalt, gyors, sok kell belole
  - Integration test: valos-szeru kornyezet, kevesebb kell
  - E2e test: teljes rendszer, a legkevesebb kell
  - Supertest: Express API teszteles valos HTTP keresekkel
  - Mock-olas: fuggoseegek hamisitasa izolalt tesztekhez
  - Teszteld az uzleti logikat es a szel-eseteket, ne a trivialis kodot

  Ezzel a TypeScript Backend oktatoanyag veget ert. A legfontosabb
  tanulsag: a backend fejlesztes nem csupan a "mukodik" szintrol szol.
  A tipusbiztonssag, a tiszta kod szerkezet, a helyes hibakezelees es
  a teszteles egyutt adjak azt a minosseget, ami egy megbizhato,
  karbantarthato alkalmazast eredmenyez.
*/

export { szamoldKiAKedvezmenytBE, createApp, jestConfig };
