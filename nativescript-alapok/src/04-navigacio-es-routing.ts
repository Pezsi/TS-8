/*
  Navigacio es routing -- oldalak kozotti mozgas

  Egy mobilalkalmazas altalaban tobb "oldalbol" (kepernyobol) all.
  A felhasznalo navigal az oldalak kozott: megnyit egy listaat,
  ranyom egy elemre, megnyilik a reszletezoo oldal, visszalep, stb.

  A NativeScript navigacios rendszere a Frame es Page fogalmakra epul.
  A Frame egy keret, ami az oldalakat tartalmazza, a Page pedig egy
  konkret kepernyoo. A Frame kezeli a navigacios stack-et (verem),
  ami nyilvantartja, melyik oldalakon jartunk, hogy a "vissza" gomb
  mukodjon.

  Ez hasonllit a bongeszoo tortenetehez: minden uj oldal rakerukl a
  veremre, a "vissza" gomb pedig leveszi a legfelso elemet.
*/

import {
  Frame, Page, NavigatedData, ShownModallyData,
  StackLayout, Label, Button, GridLayout
} from "@nativescript/core";


/* --- 1. Frame es Page ---

  A Frame a navigacious konteneer. Az alkalmazasodnak legalabb egy
  Frame-je van (az app-root.xml-ben definialod). A Page az egyes
  kepernyyok.

  Alapveto navigacio XML-bol:
  A legegyszerubb eset, amikor az alkalmazas indul:
*/

// app-root.xml tartalma:
// <Frame defaultPage="main-page" />
// Ez azt mondja: az alkalmazas indulaasakor a "main-page" oldalt toltsd be.

// main-page.xml:
// <Page loaded="onLoaded">
//   <StackLayout>
//     <Label text="Fooldal" />
//     <Button text="Reszletek" tap="onReszletekTap" />
//   </StackLayout>
// </Page>


/* --- 2. Navigacio TypeScript-bol ---

  A navigaciot a Frame objektumon keresztul vegezzuk. A leggyakrabban
  hasznalt muveletek: navigate (elore), goBack (vissza), canGoBack
  (van-e hova visszalepni).
*/

// Elore navigalas -- uj oldal megnyitasa
function navigaljReszletekre(frame: Frame, elemId: number): void {
  frame.navigate({
    // A moduleName az oldal fajlneve (kiterjesztes nelkul)
    moduleName: "reszletek-page",

    // Context: adatok atadasa a kovetkezo oldalnak
    // Ez baarmi lehet -- szam, string, objektum
    context: {
      elemId: elemId,
      forras: "fooldal",
    },

    // Animacio beallitasok
    animated: true,
    transition: {
      name: "slide",     // slide, fade, flipRight, flipLeft, slideTop, stb.
      duration: 300,     // milliszekundum
      curve: "easeInOut",
    },
  });
}

// Visszafele navigalas
function navigaljVissza(frame: Frame): void {
  if (frame.canGoBack()) {
    frame.goBack();
  } else {
    console.log("Nincs hova visszalepni -- ez az elso oldal");
  }
}


/* --- 3. Adatok ataadasa oldalak kozott ---

  Amikor navigalsz egy uj oldalra, a context objektumban barmilyen
  adatot atadhatsz. A celoldal a navigatedTo esemenybenel kapja meg
  ezt az adatot.
*/

// A celoldalon (reszletek-page.ts):
function onNavigatedTo(args: NavigatedData): void {
  const page = args.object as Page;
  const context = page.navigationContext as {
    elemId: number;
    forras: string;
  };

  console.log(`Elem ID: ${context.elemId}`);
  console.log(`Honnan jottem: ${context.forras}`);

  // Most mar hasznahatod az elemId-t az adatok betoltesehez
}


/* --- 4. Page lifecycle -- az oldal eletciklusa ---

  Minden Page-nek vannak esemeenyei, amik a kulonbozo allapotvaltozasokkor
  aktivaalodnak. Ezek fontosak, mert segitenek megerteni, mikor mi
  tortenik, es hol erdemes az adatokat betolteni vagy menteni.

  Az esemenyek sorrendje:
  1. loaded       -- az oldal XML-je betoltodott es a UI elemek elkeszultek
  2. navigatingTo -- epp navigaalunk IDE (meg nem latszik)
  3. navigatedTo  -- megeerkeztunk (mar latszik)
  4. navigatingFrom -- epp navigaalunk INNEN valahova
  5. navigatedFrom  -- elnavigaaltunk (ez az oldal mar nem latszik)
  6. unloaded     -- az oldal UI elemei megsemmisultek
*/

function pageLifecyclePelda(page: Page): void {
  page.on("loaded", () => {
    console.log("1. Az oldal betoltodott -- a UI elemek keszek");
    // Itt erdemes inicializalni az UI-t
  });

  page.on("navigatingTo", (args: NavigatedData) => {
    console.log("2. Epp navigaalunk ide");
    console.log("   Eloszor jarunk itt?", !args.isBackNavigation);
  });

  page.on("navigatedTo", () => {
    console.log("3. Megeerkeztunk -- az oldal lathato");
    // Itt erdemes adatokat betolteni (API hivas, adatbazis lekerdezes)
  });

  page.on("navigatingFrom", () => {
    console.log("4. Epp elhagyjuk az oldalt");
    // Itt erdemes menteni az allapotot, ha kell
  });

  page.on("navigatedFrom", () => {
    console.log("5. Elhagytuk az oldalt");
  });

  page.on("unloaded", () => {
    console.log("6. Az oldal megsemmisult");
    // Itt erdemes felszabaditani az eroforrasokat (listener-ek, timer-ek)
  });
}


/* --- 5. Modal dialogusok ---

  Neha nem akarssz uj oldalra navigalni, hanem csak egy felugro
  ablakot akarsz megjelenitetni (peldaul egy szerkeszto form,
  egy megerosito kerdes, vagy egy valaszto).

  A modal dialogus az aktualis oldal FOLOTT jelenik meg, es amig
  nyitva van, a moogotte levo oldal nem hasznalhato.
*/

// Modal megnyitasa
function nyissdMegAModalt(page: Page): void {
  const modalOldal = "szerkeszto-modal";

  page.showModal(modalOldal, {
    // Adatok atadasa a modalnak
    context: { cim: "Elem szerkesztese", elemId: 42 },

    // Callback, ami a modal bezaarasakor hivodik meg
    closeCallback: (eredmeny: unknown) => {
      if (eredmeny) {
        console.log("A modal visszaadott valamit:", eredmeny);
      } else {
        console.log("A modalt bezartak mentes nelkul");
      }
    },

    // Teljes kepernyo-e?
    fullscreen: false,

    // A modal mogotti terulet sotetithe-e?
    animated: true,
  });
}

// A modal oldalon belul (szerkeszto-modal.ts):
function onModalLoaded(args: ShownModallyData): void {
  const page = args.object as Page;
  const context = args.context as { cim: string; elemId: number };
  const closeCallback = args.closeCallback;

  console.log(`Modal megnyitva: ${context.cim}`);

  // A modal bezarasa eredmennyel:
  // closeCallback({ mentve: true, adat: { ... } });

  // A modal bezarasa eredmeny nelkul:
  // closeCallback(null);
}


/* --- 6. Navigacios mintak ---

  A gyakorlatban nehany tipikus navigacios minta letezik:
*/

// Minta 1: Lista -> Reszletek (a leggyakoribb)
// A fooldalalon van egy lista, es egy elemre kattintva megnyilik a reszletezoo oldal.
function listaReszletekNavig(frame: Frame, elemId: number): void {
  frame.navigate({
    moduleName: "reszletek-page",
    context: { elemId },
    animated: true,
    transition: { name: "slide", duration: 300 },
  });
}

// Minta 2: Navigacios verem torlese (peldaul login utan)
// A bejelentkezes utan nem akarjuk, hogy a "vissza" gomb a login oldalra vigyen.
function loginUtanNavig(frame: Frame): void {
  frame.navigate({
    moduleName: "fooldal-page",
    clearHistory: true,  // Torli a teljes navigaacios verem-et
    animated: true,
    transition: { name: "fade", duration: 200 },
  });
}

// Minta 3: Oldal cserelese animacio nelkul
// Gyors navigaalas, ahol nem akarunk latvanvyos atmenetet.
function gyorsNavig(frame: Frame, oldalNev: string): void {
  frame.navigate({
    moduleName: oldalNev,
    animated: false,
  });
}


/* --- Osszefoglalas ---

  - A Frame a navigaacios keret, a Page az egyes kepernyyok
  - navigate() elore leptet, goBack() visszalep
  - A context-ben barmilyen adatot ataddhatsz a kovetkezo oldalnak
  - A Page lifecycle esemennyei segitenek az adatok betolteseben es menteseben
  - Modal dialogusok felugro ablakokhoz -- nem navigacio, hanem retegeles
  - clearHistory: true torli a vermet (hasznalod login utan)

  A kovetkezo fajlban megnezzuk a NativeScript legeroosebb kepesseget:
  a kozvetlen nativ API hozzaferest.
*/

export {
  navigaljReszletekre,
  navigaljVissza,
  onNavigatedTo,
  nyissdMegAModalt,
  loginUtanNavig,
};
