/*
  Tipusbiztonsag alapok -- avagy miert segit a TypeScript abban, hogy kevesebb
  biztonsagi hiba keruljon a kodunkba?

  Ha JavaScript-bol jossz, valoszinuleg megszoktad, hogy a nyelv szinte semmit
  nem ellenorizz helyetted. Athatsz egy szamot oda, ahol stringet varsz, es
  a program nem szol -- egyszeruen csinalja, amit tud, es a hiba csak futas
  kozben jon elo, gyakran a felhasznalo gepen, production-ben.

  A TypeScript lenyege, hogy egy csomo ilyen hibat mar fejlesztes kozben,
  forditas idoben elkap. Ez nem csak kenyelem kerdese -- biztonsagi
  szempontbol is hatalmas elony. Ha a tipusrendszer kikenyszeriti, hogy
  egy valtozo mindig szam, akkor nem tudsz belecsempeszni egy rosszindulatu
  stringet. Ha egy fuggveny visszateresi tipusa jol definialt, nem felejtesz
  el hibat kezelni.

  Ebben a fajlban vegigmegyunk a legfontosabb tipusbiztonsagi koncepciokon,
  es minden temanalmindenkezett mutatunk "rossz" (unsafe) es "jo" (safe)
  peldat is. A cel az, hogy megertsd: a tipusrendszer nem akadalyoz --
  hanem megved.
*/


/* --- 1. Az "any" problema ---

  Az "any" a TypeScript kikapcsolo gombja. Ha egy valtozo tipusa "any",
  akkor a fordito nem ellenorzi, mit csinalsz vele. Ez pont olyan, mintha
  JavaScript-et irnal -- elveszited az osszes garanciat.

  Miert veszelyes? Mert ha egy felhasznaloi bemenet "any" tipusu, barmi
  lehet benne: szam, string, objektum, sot akar egy tamado altal
  beszurt script is. Es a fordito nem fog szolni.
*/

// ROSSZ -- any hasznalata
function feldolgozBemenetUnsafe(adat: any): string {
  // A fordito nem szol, hogy az adat.nev lehet undefined, null, vagy barmi
  return `Udvozollek, ${adat.nev}!`;
}

// Az alabbi hivas nem dob hibat forditaskor, pedig nyilvan rossz:
// feldolgozBemenetUnsafe(42);
// feldolgozBemenetUnsafe(null);
// feldolgozBemenetUnsafe({ name: "Janos" }); // "nev" helyett "name" -- nev undefined lesz

// JO -- tipusos megoldas
interface Felhasznalo {
  nev: string;
  email: string;
}

function feldolgozBemenetSafe(adat: Felhasznalo): string {
  // Itt a fordito garantalja, hogy adat.nev letezik es string
  return `Udvozollek, ${adat.nev}!`;
}

// Ez mar hibat dob forditaskor:
// feldolgozBemenetSafe(42);                    // HIBA
// feldolgozBemenetSafe({ name: "Janos" });     // HIBA -- "name" nem "nev"


/* --- 2. Az "unknown" hasznalata "any" helyett ---

  Ha nem tudod elore, milyen tipusu adatot kapsz (peldaul egy kulso API-bol),
  hasznalj "unknown"-t "any" helyett. Az "unknown" azt mondja: "nem tudom,
  mi ez, de MUSZAJ ellenoriznem, mielott barmit csinalnek vele."

  Ez a kulonbseg oriasi. Az "any" engedi, hogy vak modra hasznald az adatot.
  Az "unknown" rakenyszerltt, hogy eloszor megvizsgald, mit kaptal.
*/

// ROSSZ -- kulso API valasz "any"-kent
function kezeldAValasztUnsafe(valasz: any): string {
  return valasz.data.uzenet.toUpperCase();
  // Ha a valasz nem ilyen strukturaju, futas kozben dob hibat
}

// JO -- kulso API valasz "unknown"-kent
function kezeldAValasztSafe(valasz: unknown): string {
  if (
    typeof valasz === "object" &&
    valasz !== null &&
    "data" in valasz
  ) {
    const data = (valasz as { data: unknown }).data;
    if (
      typeof data === "object" &&
      data !== null &&
      "uzenet" in data
    ) {
      const uzenet = (data as { uzenet: unknown }).uzenet;
      if (typeof uzenet === "string") {
        return uzenet.toUpperCase();
      }
    }
  }
  return "Ismeretlen valasz formatum";
}


/* --- 3. Strict null checks ---

  A strict null checks bekapcsolasaval a TypeScript kulon kezeli a null es
  undefined ertekeket. Ez azt jelenti, hogy ha egy valtozo tipusa "string",
  akkor az tenyleg csak string lehet -- nem lehet null vagy undefined.

  Miert fontos ez biztonsagi szempontbol? Mert a null/undefined hibak az
  egyik leggyakoribb forrasai a vartalan viselkedesnek. Ha egy fuggveny
  null-t ad vissza es te nem kezeled, az alkalmazas osszeomlhat, vagy ami
  rosszabb, hibas adatot dolgozhat fel tovabb.
*/

// ROSSZ -- null nincs kezelve (strict nelkul ez lefordul)
function keressFelhasznalotUnsafe(id: number): Felhasznalo {
  const adatbazis: Map<number, Felhasznalo> = new Map();
  // get() visszaadhat undefined-ot, de a tipusunk azt mondja: Felhasznalo
  return adatbazis.get(id)!; // A "!" felkialtojelllel hazudunk a fordltonak
}

// JO -- explicit null kezeles
function keressFelhasznalotSafe(id: number): Felhasznalo | null {
  const adatbazis: Map<number, Felhasznalo> = new Map();
  const talalat = adatbazis.get(id);
  if (!talalat) {
    return null; // Explicit jelezzuk, hogy nem talaltuk
  }
  return talalat;
}

// Hasznalat -- a hivo KOTELES kezelni a null esetet:
const eredmeny = keressFelhasznalotSafe(1);
if (eredmeny === null) {
  console.log("A felhasznalo nem letezik");
} else {
  console.log(eredmeny.nev); // Itt mar biztos, hogy Felhasznalo
}


/* --- 4. Type narrowing (tipusszukites) ---

  A type narrowing azt jelenti, hogy a TypeScript kepees egy valtozo tipusat
  "szukiteni" feltetelek alapjan. Ez azert fontos, mert biztonsagos modon
  tudsz kulonbozo tipusu adatokkal dolgozni anelkul, hogy type assertion-t
  (as) vagy "any"-t hasznalnal.

  A tipusszukites a te biztonsagi orod: ha helyesen hasznalod, a fordito
  garantalja, hogy minden agban a megfelelo tipussal dolgozol.
*/

type ApiValasz =
  | { spikerces: true; adat: Felhasznalo }
  | { sikeres: false; hibauzenet: string };

// ROSSZ -- type assertion-nel ("as" kulcsszoval) atugorjuk az ellenorzest
function kezeldAValasztUnsafe2(valasz: ApiValasz): string {
  // Ez veszelyes, mert ha a valasz hibas, futas kozben kapunk hibat
  const adat = (valasz as { sikeres: true; adat: Felhasznalo }).adat;
  return adat.nev;
}

// JO -- type narrowing discriminated union-nel
type ApiValaszSafe =
  | { sikeres: true; adat: Felhasznalo }
  | { sikeres: false; hibauzenet: string };

function kezeldAValasztSafe2(valasz: ApiValaszSafe): string {
  if (valasz.sikeres) {
    // Itt a fordlto TUDJA, hogy valasz.adat letezik es Felhasznalo tipusu
    return valasz.adat.nev;
  } else {
    // Itt a fordito TUDJA, hogy valasz.hibauzenet letezik es string
    return `Hiba: ${valasz.hibauzenet}`;
  }
}


/* --- 5. Readonly es Immutability ---

  A biztonsagos kod egyik alappillere, hogy az adatokat ne lehessen
  veletlenul (vagy szandekosan) modositani. A TypeScript readonly
  kulcsszava segit ebben: megjelolhetsz property-ket vagy egesz
  objektumokat ugy, hogy azokat nem lehet megvaltoztatni.

  Ez kulonosen fontos konfiguracios objektumoknal, jogosultsagi
  beallitasoknal, es minden olyan adatnal, aminek az eletciklusa
  soran nem kellene valtoznia.
*/

// ROSSZ -- modosithato konfiguracio
const configUnsafe = {
  apiKulcs: "szuper-titkos-kulcs",
  maxProbalkozsok: 3,
};
// Barki megvaltoztathatja:
configUnsafe.maxProbalkozsok = 999999; // Brute force tamadas megkonnyitve

// JO -- readonly konfiguracio
const configSafe: Readonly<{
  apiKulcs: string;
  maxProbalkozsok: number;
}> = {
  apiKulcs: "szuper-titkos-kulcs",
  maxProbalkozsok: 3,
};
// configSafe.maxProbalkozsok = 999999; // HIBA -- forditasi hiba!

// Megoldas a melyebb objektumokra: as const
const jogosultsagok = {
  admin: ["read", "write", "delete"],
  felhasznalo: ["read"],
} as const;
// jogosultsagok.admin.push("hack"); // HIBA -- readonly tomb, nem bovitheto


/* --- 6. Enum helyett union type ---

  Az enum-ok hasznalata neha nem vart viselkedeshez vezethet, mert
  numerikus enum-ok eseten barmelyik szam ervenyes ertek. A union type
  szigorubb: csak az altad megadott ertekeket fogadja el.
*/

// ROSSZ -- numerikus enum
enum SzerepUnsafe {
  Admin = 0,
  Felhasznalo = 1,
}
// Ez "valid" TypeScript szemmel, pedig nyilvan hibas:
const valakiSzerepe: SzerepUnsafe = 42 as SzerepUnsafe;

// JO -- string union type
type Szerep = "admin" | "felhasznalo" | "moderator";

function ellenorizJogosultsag(szerep: Szerep): boolean {
  switch (szerep) {
    case "admin":
      return true;
    case "felhasznalo":
      return false;
    case "moderator":
      return false;
    // Ha uj szerepet adsz hozza a Szerep tipushoz, a fordito szol,
    // hogy itt is kezelned kell -- igy nem felejthetsz el egy esetet
  }
}

// ellenorizJogosultsag("hacker"); // HIBA -- nem letezo szerep


/* --- Osszefoglalas ---

  A TypeScript tipusrendszere nem csupan kenyelem vagy fejlesztoi elmenyt
  javito eszkoz. Helyesen hasznalva egy komplett vedelmi reteg, ami
  megakadalyozza, hogy a leggyakoribb programozasi hibak biztonsagi
  resekke valjanak.

  A legfontosabb szabalyok:
  - Keruldd az "any"-t, hasznalj "unknown"-t ha nem tudod a tipust
  - Kapcsold be a strict modot a tsconfig-ban
  - Kezeld a null/undefined eseteket explicit modon
  - Hasznalj discriminated union-okat type assertion helyett
  - Tedd readonly-va, amit nem kell modositani
  - Valaszd a string union type-ot a numerikus enum helyett

  A kovetkezo fajlban megnezzuk, hogyan validalhatjuk a felhasznaloi
  bemenetet ugy, hogy a runtime sem tudjon meglepeteseket okozni.
*/

export { Felhasznalo, Szerep };
