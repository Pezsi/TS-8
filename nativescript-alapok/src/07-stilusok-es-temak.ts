/*
  Stilusok es temak -- hogyan nez ki az alkalmazas?

  A NativeScript CSS-t hasznal a stilusok definialasahoz, de nem a
  teljes webes CSS-t, hanem annak egy reszhalmazat. Ez azert van,
  mert a nativ UI elemeknek mas a stilusozhatosaga, mint a HTML
  elemeknek. Peldaul nincs "float" vagy "position: absolute" a
  hagyomanyos CSS ertelemben (ezeket a layout rendszer kezeli).

  Az jo hir: ha issmered a CSS-t, a legtobb dolog ismerosnek fog tunni.
  A fo kulonbseg a szelektorok korlatai es nehany hianyzo tulajdonsag.
*/


/* --- 1. Hol definialhatsz stilusokat? ---

  Harom szinten tudsz stilusokat megadni, es ezek kaszkadolnak
  (a specifikusabb felulirja az altalaanosabbat):

  1. Alkalmazas szintu (app.css)
     Ez vonatkozik az egesz alkalmazasra. Ide kerulnek a globalis
     stilusok: betutipus, szinek, altalanos margok.

  2. Oldal szintu (oldal-nev.css)
     Minden Page-hez tartozhat egy CSS fajl. Csak arra az oldalra
     ervenyes.

  3. Inline stilus
     Kozvetlenul az XML elemre irva, a style attributummal.
     Keruldd, ha lehett -- nehezen karbantarthato.
*/

// Pelda app.css:
const appCssPelda = `
/* Alkalmazas szintu stilusok */

/* Altalanos szoveg formaaazas */
Label {
  font-size: 16;
  color: #333333;
}

/* Gombok */
Button {
  background-color: #2196F3;
  color: white;
  border-radius: 8;
  padding: 12 24;
  font-size: 16;
  font-weight: bold;
}

/* Beviteli mezok */
TextField {
  border-width: 1;
  border-color: #cccccc;
  border-radius: 4;
  padding: 8 12;
  font-size: 16;
}

/* Osztalyok (class szelektorra) */
.cim {
  font-size: 24;
  font-weight: bold;
  color: #1a1a1a;
  margin-bottom: 16;
}

.alcim {
  font-size: 18;
  color: #666666;
  margin-bottom: 8;
}

.figyelmeztetes {
  color: #d32f2f;
  font-weight: bold;
}

.kartya {
  background-color: #ffffff;
  border-radius: 8;
  padding: 16;
  margin: 8;
}
`;


/* --- 2. Tamogatott CSS tulajdonsagok ---

  Nem minden webes CSS tulajdonsag mukodik NativeScript-ben.
  A legfontosabbak, amik MUKODNEK:

  Szoveg:
  - color, font-size, font-weight, font-family, font-style
  - text-align, text-decoration, text-transform
  - letter-spacing, line-height

  Hatter:
  - background-color, background-image
  - background-repeat, background-position, background-size

  Keret:
  - border-color, border-width, border-radius
  - border-top-color, stb. (oldalankent kulon is)

  Meretezess es terkoz:
  - width, height, min-width, min-height
  - margin, margin-top, margin-right, margin-bottom, margin-left
  - padding, padding-top, padding-right, padding-bottom, padding-left

  Lathatosag:
  - visibility (visible, collapse, hidden)
  - opacity (0-1)

  Fontosabbak, amik NEM mukodnek:
  - display (nincs block/inline/flex -- a layout rendszer kezeli)
  - position (nincs absolute/relative/fixed -- AbsoluteLayout-ot hasznalj)
  - float, z-index (ezek a layout rendszer szintjen kezelhetook)
  - box-shadow (platform-specifikus megoldasok vannak ra)
  - transition, animation (JavaScript animaciokat hasznnalj helyette)
*/


/* --- 3. Szelektorok ---

  A NativeScript CSS szelektorok korlatozzottabbak, mint a webes CSS.
  Ami mukodik:
*/

const szelektorPeldak = `
/* Tipus szelektor -- a NativeScript UI elem neve */
Label { color: black; }
Button { background-color: blue; }

/* Osztaly szelektor */
.kiemelt { font-weight: bold; }
.hatter-piros { background-color: red; }

/* ID szelektor */
#foGomb { font-size: 20; }

/* Attributum szelektor (korlatozott) */

/* Allapot szelektor */
Button:highlighted { background-color: #1976D2; }
TextField:focused { border-color: #2196F3; }

/* Hierarchia szelektor */
StackLayout > Label { margin-bottom: 4; }
Page Label { color: #333333; }

/* Ami NEM mukodik: */
/* :hover (nincs hover mobil eszkozoon) */
/* :nth-child, :first-child (nem tamogatott) */
/* ::before, ::after (nincs pseudo-element) */
/* @media queriek (platformspecifikus fajlokat hasznalj helyette) */
`;


/* --- 4. Platformspecifikus stilusok ---

  Ahogy a kodnal, a stilusoknal is lehetoseged van platformspecifikus
  fajlokat letrehozni:

  - app.css          -- mindket platform
  - app.android.css  -- csak Android
  - app.ios.css      -- csak iOS

  Es az XML-ben is hasznalhatsz platform-specifikus CSS osztalyokat:
*/

const platformSpecifikusCss = `
/* Az Android es iOS kulon CSS osztalyokat kap automatikusan */
/* a gyoker elemre, igy szurhetesz platformra: */

.ns-android Label {
  font-family: "Roboto", sans-serif;
}

.ns-ios Label {
  font-family: "San Francisco", -apple-system;
}

/* Sotet/vilagos mod */
.ns-dark Label {
  color: #ffffff;
}

.ns-light Label {
  color: #333333;
}
`;


/* --- 5. Dinamikus stilus valtas TypeScript-bol --- */

import { Label, Page, Application } from "@nativescript/core";

function stilusValtasPelda(label: Label): void {
  // CSS osztaly hozzaadasa
  label.className = "cim kiemelt";

  // CSS osztaly modositasa futtatas kozben
  label.className = label.className + " figyelmeztetes";

  // Inline stilus beallitasa kodbol
  label.color = new (require("@nativescript/core").Color)("#ff0000");
  label.fontSize = 24;
  label.fontWeight = "bold";
}


/* --- 6. Tema valtas (sotet/vilagos mod) ---

  Modern alkalmazasoknal elvaras a sotet mod tamogatasa. A NativeScript
  automatikusan kozveti az operaacios rendszer tema beallitasat.
*/

const temaStilus = `
/* Vilagos tema (alapertelmezett) */
Page {
  background-color: #ffffff;
  color: #333333;
}

.kartya {
  background-color: #f5f5f5;
}

/* Sotet tema */
.ns-dark Page {
  background-color: #121212;
  color: #e0e0e0;
}

.ns-dark .kartya {
  background-color: #1e1e1e;
}

.ns-dark TextField {
  border-color: #444444;
  color: #e0e0e0;
  background-color: #2c2c2c;
}

.ns-dark Button {
  background-color: #bb86fc;
  color: #000000;
}
`;

// A rendszer tema lekerdezese kodbol:
function aktualisTema(): string {
  // @ts-ignore
  const sotetMod = Application.systemAppearance?.() === "dark";
  return sotetMod ? "sotet" : "vilagos";
}


/* --- Osszefoglalas ---

  - A NativeScript CSS-t hasznal, de a webes CSS egy reszhalmazat
  - Harom szint: alkalmazas, oldal, inline
  - A legtobb szoveg-, szin-, keret- es meret-tulajdonsag mukodik
  - Nincs display, position, float, box-shadow, @media query
  - Platformspecifikus stilusok: .android.css / .ios.css fajlok
  - Sotet mod: .ns-dark / .ns-light automatikus CSS osztalyok
  - TypeScript-bol is modosithatood a stilusokat dinamikusan

  Az utolso fajlban osszefoglaljuk, mikor erdemes NativeScript-et
  valasztani es mikor nem.
*/

export { stilusValtasPelda, aktualisTema };
