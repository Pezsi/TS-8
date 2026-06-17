/*
  Adatkezeles es data binding -- hogyan kapcsolodik az adat a felulethez?

  Egy mobilalkalmazasban az adatok allandoan valtoznak: a felhasznalo
  beir valamit egy mezobe, jonn egy valasz az API-bol, frissul egy szamlalo.
  A kerdes az, hogyan tukrozze a feluletet ezeket a valtozasokat anelkul,
  hogy minden egyes valtozasnal kezzzel frissitened kellene az UI elemeket.

  A NativeScript erre az Observable mintaat hasznalja. Az Observable
  egy olyan objektum, ami "figyelheto": ha megvaltozik benne valami,
  automatikusan erteesiti az osszes erdekelt felet (peldaul az UI elemeket).

  Ez eloszor bonyolultnak tunhet, de amint megerted az elveet, rengeteg
  felesleges kodot takarit meg.
*/

import { Observable, ObservableArray, EventData } from "@nativescript/core";


/* --- 1. Observable alapok ---

  Az Observable a NativeScript adatkezelsesenek alapja. Lenyegeben egy
  szotar (key-value store), ami szol, ha valamelyik erteke megvaltozik.
*/

// Hozzzunk letre egy egyszeru observable-t
const felhasznalo = new Observable();

// Ertekek beallitasa
felhasznalo.set("nev", "Kiss Janos");
felhasznalo.set("email", "janos@pelda.hu");
felhasznalo.set("kor", 28);

// Ertekek olvasasa
console.log("Nev:", felhasznalo.get("nev"));     // "Kiss Janos"
console.log("Kor:", felhasznalo.get("kor"));       // 28

// Figyeles a valtozasokra
felhasznalo.on("propertyChange", (args: EventData & { propertyName: string; value: unknown }) => {
  console.log(`A(z) "${args.propertyName}" property megvaltozott: ${args.value}`);
});

// Most ha megvaltoztatjuk az erteket, a figyeloo automatikusan ertesul:
felhasznalo.set("nev", "Nagy Peter");
// Kimenet: A(z) "nev" property megvaltozott: Nagy Peter


/* --- 2. Data binding -- az adat es a feluleet osszekapcsolasa ---

  A data binding lenyege, hogy az Observable property-ket kozvetlenul
  osszekotod egy UI elem tulajdonsagaval. Ha a property valtozik,
  a UI automatikusan frissul. Es forditva: ha a felhasznalo modosit
  egy mezot, az Observable-ben is frissul az ertek.

  XML-ben a binding szintaxisa: {{ propertyNev }}
*/

// Egy tipikus oldal modell (a "binding context"):
function hozzLetreSzerkeesztoModellt(): Observable {
  const modell = new Observable();

  modell.set("cim", "");
  modell.set("tartalom", "");
  modell.set("karakterSzam", 0);
  modell.set("mentheto", false);

  // A tartalom valtozasakor frissitjuk a karakter szamot es a mentheto allapotot
  modell.on("propertyChange", (args: EventData & { propertyName: string }) => {
    if (args.propertyName === "tartalom" || args.propertyName === "cim") {
      const cim = modell.get("cim") as string;
      const tartalom = modell.get("tartalom") as string;
      modell.set("karakterSzam", tartalom.length);
      modell.set("mentheto", cim.length > 0 && tartalom.length > 0);
    }
  });

  return modell;
}

// Az XML oldal (szerkeszto-page.xml) a bindinget igy hasznaalja:
//
// <Page>
//   <StackLayout>
//     <TextField text="{{ cim }}" hint="Add meg a cimet..." />
//     <TextView text="{{ tartalom }}" hint="Ird be a tartalmat..." />
//     <Label text="{{ karakterSzam }} karakter" />
//     <Button text="Mentes" isEnabled="{{ mentheto }}" tap="onMentes" />
//   </StackLayout>
// </Page>
//
// A {{ cim }} jeloles azt jelenti: ez a mezo a modell "cim" property-jehez
// van kotve. Ha a felhasznalo beir valamit, a modell frissul. Ha a modellt
// kodbol frissited, a mezo is frissul. Ez a ketiranyu (two-way) binding.


/* --- 3. Egyiranyu vs ketiranyu binding ---

  Egyiranyu binding (one-way): az adat valtozasakor frissul a feluleet,
  de a feluuleti valtozas nem hat vissza az adatra.
  Peldaa: egy Label szovege -- a felhasznalo nem szerkeszti, csak olvassa.

  Ketiranyu binding (two-way): mindket iranyban mukodik.
  Pelda: egy TextField -- a felhasznalo modosithatja, es a modell is
  frissulhet kodbol.

  Az XML-ben a ketiranyu binding az alaperteelmezett a beviteli mezokneel.
*/


/* --- 4. ObservableArray -- lista adatok kezelese ---

  Az ObservableArray ugyanaz, mint egy sima JavaScript tomb, de
  figyelheto: ha elemet adsz hozza, toroolsz vagy modositasz,
  a hozzakotott ListView automatikusan frissul.

  Ez kulonosen fontos, mert a ListView-t (amit az elozo fejezetben
  lattunk) az ObservableArray-jel mukoodtetheted hatekonyan.
*/

interface Tennivalo {
  szoveg: string;
  kesz: boolean;
  letrehozva: Date;
}

const tennivalok = new ObservableArray<Tennivalo>([
  { szoveg: "Bevassarlas", kesz: false, letrehozva: new Date() },
  { szoveg: "TypeScript tanulas", kesz: true, letrehozva: new Date() },
]);

// Uj elem hozzaadasa -- a ListView automatikusan frissul
function ujTennivalo(szoveg: string): void {
  tennivalok.push({
    szoveg,
    kesz: false,
    letrehozva: new Date(),
  });
  console.log(`Hozzaadva: "${szoveg}", osszes tennivalo: ${tennivalok.length}`);
}

// Elem torlese index alapjan
function torolTennivalot(index: number): void {
  if (index >= 0 && index < tennivalok.length) {
    const torolt = tennivalok.getItem(index);
    tennivalok.splice(index, 1);
    console.log(`Torolve: "${torolt.szoveg}"`);
  }
}

// Elem modositasa
function keszreAllit(index: number): void {
  if (index >= 0 && index < tennivalok.length) {
    const elem = tennivalok.getItem(index);
    tennivalok.setItem(index, { ...elem, kesz: !elem.kesz });
    console.log(`"${elem.szoveg}" most ${elem.kesz ? "nincs kesz" : "kesz"}`);
  }
}


/* --- 5. Esemeny rendszer ---

  Az Observable nem csak property valtozasokat tud figyelni.
  Sajat esemenyeket is definialhatszlz es fire-olhatsz, amikkel
  a komponensek kozott kommunikalhatsz.
*/

const esemenyCsatorna = new Observable();

// Egy komponens feliratkozik az esemenyre
esemenyCsatorna.on("felhasznaloBejelentkezett", (args: EventData & { adat?: unknown }) => {
  console.log("Ertesites: a felhasznalo bejelentkezett", args.adat);
  // Itt frissithetjuk a feluletet, betolthetjuk az adatokat, stb.
});

// Mashol a kodban kivaaltjuk az esemenyt
function bejelentkezesUtaan(felhasznaloNev: string): void {
  esemenyCsatorna.notify({
    eventName: "felhasznaloBejelentkezett",
    object: esemenyCsatorna,
    adat: { felhasznaloNev },
  } as EventData & { adat: unknown });
}


/* --- 6. Binding context beallitasa oldal szinten ---

  A gyakorlatban a binding context-et az oldal betoltesekor allitjuk be.
  Ettol kezdve az oldalon levo osszes {{ }} binding ebbol az Observable-bol
  olvassa az adatokat.
*/

import { Page } from "@nativescript/core";

function oldalBetoltve(args: EventData): void {
  const page = args.object as Page;

  // Az oldal modellje -- ez lesz a binding context
  const modell = new Observable();
  modell.set("cim", "Fooldal");
  modell.set("felhasznaloNev", "Kiss Janos");
  modell.set("ertesitesekSzama", 3);
  modell.set("betoltes", false);

  page.bindingContext = modell;

  // Most az oldal XML-jeben barmelyik {{ }} kifejezes
  // ebbol a modellbol olvas
}


/* --- Osszefoglalas ---

  - Az Observable a NativeScript adatkezelesenek alapja
  - Data binding: az adat valtozasa automatikusan frissiti a feluulet
  - Ketiranyu binding: a feluleti valtozas visszahat az adatra
  - ObservableArray: figyelheto tomb -- ListView-val egyutt hasznald
  - Sajat esemenyek: komponensek kozotti kommunikacio
  - A binding context az oldal szintjen osszekapcsolja a modellt a feluletteel

  A kovetkezo fajlban a stilusokat es a vizualis megjeleenest nezzuk meg.
*/

export {
  hozzLetreSzerkeesztoModellt,
  ujTennivalo,
  torolTennivalot,
  keszreAllit,
  bejelentkezesUtaan,
  tennivalok,
};
