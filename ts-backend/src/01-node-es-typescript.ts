/*
  Node.js es TypeScript -- miert erdemes TypeScript-et hasznalni a backend-en?

  Ha mar talalkoztal a TypeScript-tel frontend oldalon, johet a kerdes:
  mi ertelme van a szerveren is TypeScript-et hasznalni? A rovid valasz:
  ugyanazok az elonyok, mint frontend-en, de a backend-en meg fontosabbak.

  A backend kod altalaban:
  - Hosszabb eletertuartalmu (evekig fut production-ben)
  - Tobb fejleszto dolgozik rajta egyszerre
  - Komolyabb kovetkezmenyei vannak a hibaknak (adatvesztes, biztonsagi res)
  - Osszetettebb adatstrukturakkal dolgozik (adatbazis, API-k, uzleti logika)

  Mindezek miatt a tipusbiztonssag meg inkabb megeri a befektetett energiat.
*/


/* --- 1. A Node.js roviden ---

  A Node.js lehetove teszi, hogy JavaScript-et (es TypeScript-et) futtass
  a szerveren. Ugyanaz a V8 motor hajtja, ami a Chrome bongeszoben is fut.

  Miert lett nepszeru?
  - Egy nyelv a frontend-en es a backend-en
  - Non-blocking I/O: nagyon hatekony sok parhuzamos kereset kezelesenel
  - Hatalmas okoszisztema (npm: tobb mint 2 millio csomag)
  - Egyszeru elindulni, nem kell bonyolult fejlesztokornyezet

  Miert NEM jo mindenre?
  - CPU-intenziv feladatokhoz (video konvertalas, gepi tanulas) nem idealis
  - A single-threaded modell korlatot szab (bar a worker thread-ek segitenek)
  - Nagy, monolitikus backend-eknel mas nyelvek (Java, Go, C#) neha jobb
    valasztas lehetnek
*/


/* --- 2. TypeScript vs JavaScript a backend-en ---

  Nezzuk meg konkret peldakon, mit ad a TypeScript:
*/

// JAVASCRIPT -- nincs tipusellenorzes
// function szamoldKiAzArat(termek, mennyiseg, kedvezmeny) {
//   return termek.ar * mennyiseg * (1 - kedvezmeny);
// }
// Mi a baj ezzel?
// - Honnan tudom, mi a "termek"? Van-e "ar" mezoje?
// - A "kedvezmeny" 0-1 kozott van, vagy szazalek? A tipus nem segit.
// - Ha valaki null-t ad at, futas kozben kapok hibat.

// TYPESCRIPT -- mindennek van tipusa
interface Termek {
  id: number;
  nev: string;
  ar: number; // Forintban
}

function szamoldKiAzArat(
  termek: Termek,
  mennyiseg: number,
  kedvezmenySzazalek: number // 0-100 kozotti ertek
): number {
  if (kedvezmenySzazalek < 0 || kedvezmenySzazalek > 100) {
    throw new Error("A kedvezmeny 0 es 100 kozott legyen");
  }
  return termek.ar * mennyiseg * (1 - kedvezmenySzazalek / 100);
}

// Most a fordito szol, ha:
// - Nem Termek tipust adok at
// - A mennyiseg nem szam
// - A kedvezmeny nem szam
// - Elfelejttem a visszateresi erteket hasznalni


/* --- 3. Compile time vs runtime hibak ---

  A backend fejlesztesben kulonosen fontos megerteni a kulonbseget:

  - Compile time hiba: a TypeScript fordito elkapja, MEG MIELOTT
    a kod lefutna. Ez a legjobb eset -- a hiba nem jut el a felhasznaloig.

  - Runtime hiba: a kod mar fut (akar production-ben), es valami elromlik.
    Ez a legrosszabb eset -- a felhasznalo latja a hibaat, es akar
    adatvesztes is tortenhet.

  A TypeScript celja, hogy minel tobb hibat compile time-ra hozzon.
*/

// Pelda: egy komplex backend fuggveny tipusos valaszokkal
interface SikeresValasz<T> {
  sikeres: true;
  adat: T;
}

interface HibasValasz {
  sikeres: false;
  hibaKod: number;
  uzenet: string;
}

type ApiValasz<T> = SikeresValasz<T> | HibasValasz;

// Ez a minta garantalja, hogy minden API valasz vagy sikeres (adattal),
// vagy hibas (hibakooddal). A fordito kikenyszeriti, hogy mindket esetet
// kezeld.

function kezeldAValaszt(valasz: ApiValasz<Termek>): void {
  if (valasz.sikeres) {
    // Itt a fordito TUDJA, hogy valasz.adat letezik es Termek tipusu
    console.log(`Termek: ${valasz.adat.nev}, ar: ${valasz.adat.ar} Ft`);
  } else {
    // Itt a fordito TUDJA, hogy valasz.hibaKod es valasz.uzenet letezik
    console.log(`Hiba ${valasz.hibaKod}: ${valasz.uzenet}`);
  }
}


/* --- 4. A TypeScript backend projekt felepitese ---

  Egy tipikus Node.js + TypeScript backend projekt igy nez ki:

  ts-backend/
    src/
      controllers/    -- HTTP keresek kezelese
      services/       -- Uzleti logika
      repositories/   -- Adatbazis muveletek
      middleware/      -- Express middleware-ek
      types/          -- Kozos tipusdefiniciok
      utils/          -- Segeedfuggvenyek
      index.ts        -- Az alkalmazas belepesi pontja
    prisma/
      schema.prisma   -- Adatbazis schema
    dist/             -- Lefordlitott JavaScript (git-ignore!)
    package.json
    tsconfig.json
    .env              -- Kornyezeti valtozok (git-ignore!)
    .env.example      -- Peldaa a szukseges kornyezeti valtozokrol

  A "dist" mappa a forditas eredmenye: a TypeScript kodbol JavaScript
  lesz, es production-ben az a JavaScript fut. A forraskkod (src/) marad
  TypeScript.
*/


/* --- 5. A tsconfig.json kulcsfontossagu beallitasai ---

  A tsconfig.json hatarozza meg, hogyan viselkedik a TypeScript fordlito.
  Backend-en kulonosen fontos beallitasok:
*/

// A legfontosabb beallitasok:
const tsconfigMagyarazat = {
  strict: true,
  // Bekapcsolja az osszes szigoru ellenorzest. Ez a legfontosabb --
  // nelkule a TypeScript "laza", es sok hibat nem kap el.

  noImplicitAny: true,
  // Nem engedi, hogy egy valtozo implicit "any" tipust kapjon.
  // Ha nem adsz meg tipust es nem lehet kitalalni, hibat jelez.

  strictNullChecks: true,
  // A null es undefined kulon tipus -- kotelezoo kezelni oket.

  noImplicitReturns: true,
  // Minden ag-ban kell legyen return erteke a fuggvenynek.

  target: "ES2020",
  // Milyen JavaScript verziora fordlitson. A Node.js 14+ mar tamogatja
  // az ES2020-at, tehat hasznalhatjuk a modern szintaxist.

  module: "commonjs",
  // A Node.js alapertelmezesben CommonJS modulrendszert hasznal (require).
  // ES modulok is hasznalhatoak (import/export), de a CommonJS stabilabb.
};


/* --- 6. Hasznos eszkozok a fejlesztesshez ---

  - ts-node: kozvetlenul futtatja a TypeScript fajlokat, forditas nelkul.
    Fejleszteshez nagyon hasznos, production-ben NEM ajanlott.

  - nodemon: figyeli a fajlvaltozasokat es automatikusan ujraindditja
    a szervert. "nodemon --exec ts-node src/index.ts" -- ez a
    fejlesztoi szerver.

  - tsc: a TypeScript fordito. "tsc --build" vagy "tsc -w" (watch mode).
    Production-re MINDIG le kell fordlitani.
*/


/* --- Osszefoglalas ---

  - A TypeScript a backend-en meg fontosabb, mint a frontend-en
  - A tipusrendszer megved az adatvesztestol es biztonsagi resektol
  - A compile time hibak jobbak, mint a runtime hibak
  - A strict mod bekapcsolasa az elso es legfontosabb lepes
  - Fejleszteshez ts-node + nodemon, production-re tsc forditas

  A kovetkezo fajlban elkezdunk Express szervert epiteni.
*/

export type { Termek, ApiValasz, SikeresValasz, HibasValasz };
