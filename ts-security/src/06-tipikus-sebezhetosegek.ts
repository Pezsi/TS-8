/*
  Tipikus sebezhetosegek -- OWASP Top 10 es mas gyakori tamadasi formak

  Az OWASP (Open Web Application Security Project) egy nonprofit szervezet,
  ami rendszeresen osszegyujti a leggyakoribb es legveszelyesebb webes
  sebezhetosegeket. Az OWASP Top 10 lista lenyegeben az a "minimum", amit
  minden webfejlesztonek ismernie kell.

  Ebben a fajlban megnezzuk a legfontosabb sebezhetosegeket TypeScript
  kontextusban. Mindegyikhez mutatunk konkret peldat es vedekezo megoldast.
  Nem kell mindent fejbol tudnod, de fontos, hogy felismerd ezeket a
  mintakat, amikor a sajat kododban talalkozol veluk.
*/


/* --- 1. Prototype Pollution ---

  Ez egy JavaScript-specifikus tamadas, ami a TypeScript-et is erinti.
  A JavaScript-ben minden objektumnak van egy prototype-ja (proto),
  amin keresztul orokli a tulajdonsagait. Ha egy tamado kepes modositani
  az Object.prototype-ot, az MINDEN objektumot erint az egesz alkalmazasban.

  Hogyan tortenhet? Leggyakrabban ugy, hogy a felhasznaloi bemenetet
  gondolkodas nelkul masoljuk egy objektumba.
*/

// VESZELYES -- felhasznaloi bemenet szeleskoru masolasa
function mergeUnsafe(cel: Record<string, unknown>, forras: Record<string, unknown>): Record<string, unknown> {
  for (const kulcs of Object.keys(forras)) {
    // Ha a forras tartalmaz "__proto__" kulcsot, az a prototipust modositja!
    // Egy tamado kuldheti: {"__proto__": {"isAdmin": true}}
    // Es utana MINDEN objektumon obj.isAdmin === true lesz
    (cel as Record<string, unknown>)[kulcs] = forras[kulcs];
  }
  return cel;
}

// BIZTONSAGOS -- szurjuk a veszelyes kulcsokat
function mergeSafe(cel: Record<string, unknown>, forras: Record<string, unknown>): Record<string, unknown> {
  const tiltottKulcsok = new Set(["__proto__", "constructor", "prototype"]);

  for (const kulcs of Object.keys(forras)) {
    if (tiltottKulcsok.has(kulcs)) {
      continue; // Atugorjuk a veszelyes kulcsokat
    }
    // Csak sajat tulajdonsagot masolunk
    if (Object.prototype.hasOwnProperty.call(forras, kulcs)) {
      cel[kulcs] = forras[kulcs];
    }
  }
  return cel;
}

// Meg jobb megoldas: Object.create(null) hasznalata prototipus nelkuli objektumokhoz,
// vagy egyszeruen hasznalj Map-et objektum helyett, ha felhasznaloi kulcsokrol van szo.
const biztonsagosMap = new Map<string, unknown>();


/* --- 2. ReDoS (Regular Expression Denial of Service) ---

  Egyes regularis kifejezesek katasztrofalisan lassuvaamuukodhetnek
  bizonyos bemenetekre. Ez azt jelenti, hogy egy tamado kulonlegesen
  osszeeallitott stringgel percekre vagy orakra lefagyaszthatja a
  szerveredet egyetlen keressel.

  A problema a "backtracking"-ben van: a regex motor visszalepked
  es ujra meg ujra megprobalja az illesztest, es bizonyos mintaknal
  ez exponencialisan noo.
*/

// VESZELYES -- ez a regex hajlamos ReDoS-ra
// Az (a+)+ minta eseten az "aaaaaaaaaaaaaaaaab" bemenet
// exponencialis ideig fut
const rosszRegex = /^(a+)+$/;

// Pelda: ez a fuggveny soha nem ter vissza ido elet keretben
function rosszValidacio(bemenet: string): boolean {
  return rosszRegex.test(bemenet);
}
// rosszValidacio("aaaaaaaaaaaaaaaaaaaaaaaaaab"); // Ez percekig futhat!

// BIZTONSAGOS -- egyszeru, hatekony regex
const joRegex = /^a+$/;

function joValidacio(bemenet: string): boolean {
  // Eloszor ellenorizzuk a hosszat -- ez olcso muvelet
  if (bemenet.length > 1000) {
    return false;
  }
  return joRegex.test(bemenet);
}

// Altalanos tippek ReDoS ellen:
// - Keruldd az egymasba agyazott kvantorookat: (a+)+, (a*)*
// - Keruldd az atfedoo alternativaakat: (a|a)+
// - Mindig korlatozd a bemenet hosszaaig at
// - Hasznalj regex linter-t (pl. safe-regex konyvtar)


/* --- 3. Path Traversal ---

  Path traversal (vagy directory traversal) eseten a tamado a fajlrendszer
  mas reszeire probal hozzaferni, mint amit te szantaal neki. A tipikus
  tamadasi minta: "../../../etc/passwd" -- a ".." segitsegevel fellepked
  a konyvtarszerkezetben.
*/

import path from "path";

// VESZELYES -- a felhasznalo altal adott utvonalat kozvetlenul hasznaljuk
function olvassFiletUnsafe(fajlnev: string): string {
  // Ha a fajlnev = "../../etc/passwd", akkor az /etc/passwd-t olvassa!
  const teljesUt = `/var/app/fajlok/${fajlnev}`;
  // fs.readFileSync(teljesUt) -- ez barmit olvashat a szerveren
  return teljesUt;
}

// BIZTONSAGOS -- normalizaljuk es ellenorizzuk az uutvonalat
function olvassFiletSafe(fajlnev: string): string | null {
  const engedelyezettMappa = "/var/app/fajlok";

  // A path.resolve feloldja a ".." hivatkozasokat
  const teljesUt = path.resolve(engedelyezettMappa, fajlnev);

  // Ellenorizzuk, hogy az eredmeny meg mindig az engedelyezett mappan belul van
  if (!teljesUt.startsWith(engedelyezettMappa)) {
    console.error("Path traversal kiserlet eszlelve:", fajlnev);
    return null;
  }

  return teljesUt;
}

console.log("\n--- Path Traversal pelda ---");
console.log("Normal fajl:", olvassFiletSafe("kep.png"));
console.log("Tamadas:", olvassFiletSafe("../../etc/passwd"));


/* --- 4. Insecure Deserialization ---

  A deserializacio az, amikor egy stringbol (pl. JSON-bol) objektumot
  csinalsz. Onmagaban ez nem veszelyes, de ha a deserializalt adatot
  ellenorzes nelkul hasznalod, problemak lephetnek fel.

  A JSON.parse viszonylag biztonsagos (nem futtat kodot), de ha a
  bejovo adatot nem validalod es egybol hasznalod, megis baj lehet.
*/

import { z } from "zod";

// VESZELYES -- deserializalas validacio nelkul
function dolgozzFelAdatotUnsafe(jsonString: string): void {
  const adat = JSON.parse(jsonString);
  // Az "adat" baarmi lehet -- ha hozzafersz adat.valami-hoz,
  // az futas kozben hibat dobhat vagy varatlan viselkedest okozhat
  console.log(adat.nev.toUpperCase()); // Ha nev nem string, ez hibat dob
}

// BIZTONSAGOS -- Zod schema-val validalunk deserializalas utan
const AdatSchema = z.object({
  nev: z.string().min(1).max(100),
  kor: z.number().int().min(0).max(150),
});

function dolgozzFelAdatotSafe(jsonString: string): void {
  let nyers: unknown;
  try {
    nyers = JSON.parse(jsonString);
  } catch {
    console.error("Ervenytelen JSON formatum");
    return;
  }

  const eredmeny = AdatSchema.safeParse(nyers);
  if (!eredmeny.success) {
    console.error("Validacios hiba:", eredmeny.error.errors);
    return;
  }

  // Itt mar biztosan helyes az adat
  console.log(eredmeny.data.nev.toUpperCase());
}


/* --- 5. Mass Assignment ---

  A mass assignment az, amikor a felhasznaloi bemenetet kozvetlenul
  atadod az adatbazis muveletnek. Ha a felhasznalo extra mezoket
  kuld (pl. "szerep": "admin"), es te nem szurod ki oket, a tamado
  sajat magat adminra allithatja.
*/

// VESZELYES -- az egesz request body-t mentjuk
interface FelhasznaloAdatbazis {
  nev: string;
  email: string;
  szerep: string; // Ezt a felhasznalo NEM allithatja be!
}

function frissitsFelhasznalotUnsafe(
  requestBody: Record<string, unknown>
): FelhasznaloAdatbazis {
  // Ha a requestBody tartalmaz "szerep" mezot, az is bekerul!
  // Tamado kuldheti: { "nev": "Hack", "email": "h@h.hu", "szerep": "admin" }
  return requestBody as FelhasznaloAdatbazis;
}

// BIZTONSAGOS -- csak az engedelyezett mezoket vesszuk ki
const FelhasznaloFrissitesSchema = z.object({
  nev: z.string().min(1).max(100),
  email: z.string().email(),
  // A "szerep" mezo NINCS a schema-ban -- hiaba kuldi a tamado, nem kerul be
});

function frissitsFelhasznalotSafe(
  requestBody: unknown
): { nev: string; email: string } | null {
  const eredmeny = FelhasznaloFrissitesSchema.safeParse(requestBody);
  if (!eredmeny.success) {
    return null;
  }
  return eredmeny.data;
}


/* --- 6. Timing Attack ---

  Ez egy rafinaltabb tamadas. Ha a jelszoo-osszehasonlitas sorban
  megy vegig a karaktereken es az elso nem egyezo karakternel megall,
  akkor a valaszido elarulja, hany karakter egyezett. Igy a tamado
  karakterrol karakterre kitalaalhatja a jelszot/tokent.

  A megoldas: constant-time osszehasonlitas, ami mindig ugyanannyi
  ideig tart, fuuggetlenul attol, hol van az elso elteres.
*/

import crypto from "crypto";

// VESZELYES -- korai kilepes (timing leak)
function hasonlitsdOsszUnsafe(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false; // Azonnal kilep -- timing info szivaarog
  }
  return true;
}

// BIZTONSAGOS -- constant-time osszehasonlitas
function hasonlitsdOsszeSafe(a: string, b: string): boolean {
  if (a.length !== b.length) {
    // Meg itt is erdemes fix ido alatt valaszolni,
    // de ez mar eleg jo vedelem
    return false;
  }
  return crypto.timingSafeEqual(
    Buffer.from(a, "utf-8"),
    Buffer.from(b, "utf-8")
  );
}


/* --- Osszefoglalas ---

  A sebezhetosegek, amiket itt attekintettunk:
  - Prototype pollution: szurd ki a __proto__, constructor kulcsokat
  - ReDoS: keruldd a komplex regex-eket, korlatozd a bemenet meretet
  - Path traversal: normalizald az utvonalakat, ellenorizd a hatarokat
  - Insecure deserialization: mindig validald a deserializalt adatot
  - Mass assignment: soha ne masold az egesz request body-t az adatbazisba
  - Timing attack: hasznalj constant-time osszehasonlitast

  Ezek a tamadasi formak nem elmeleti dolgok -- a valosagban mindennap
  megtortennek. A legtobb vedelem nem bonyolult, csak tudni kell roluk.

  A kovetkezo es utolso fajlban megnezzuk a kornyezeti valtozok es
  titkok helyes kezeleset.
*/

export {
  mergeSafe,
  olvassFiletSafe,
  dolgozzFelAdatotSafe,
  frissitsFelhasznalotSafe,
  hasonlitsdOsszeSafe,
};
