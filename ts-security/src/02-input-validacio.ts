/*
  Felhasznaloi bemenet validacioja -- a legfontosabb biztonsagi lepes

  Van egy nagyon fontos dolog, amit erdemes a fejlesztesi karrier elejen
  megerteni: a TypeScript tipusok csak forditas idoben leteznek. Amint
  a kodod JavaScript-re fordul es lefut, a tipusok eltunnek. Ez azt jelenti,
  hogy ha egy felhasznalo kuld neked egy HTTP requestet, a TypeScript NEM
  fogja ellenorizni, hogy a request body megfelel-e a vart tipusnak.

  Peldaul: ha van egy interfeszed ami azt mondja, hogy a felhasznalo neve
  string -- de valaki egy szamot kuld a nevben, a TypeScript nem fog szolni.
  A kodod egyszeruen megkapja a szamot es megprobal vele dolgozni.

  Ezert van szukseg runtime validaciora. A Zod egy kivalo konyvtar erre:
  lehetove teszi, hogy definiald a vart adatszerkezetet, es futas kozben
  ellenorizd, hogy a bemenet megfelel-e. Ha nem felel meg, egy reszletes
  hibauzenet jon vissza ahelyett, hogy a programod kiszamithatatlanul
  viselkedne.
*/

import { z } from "zod";

/* --- 1. Miert nem eleg a TypeScript tipus egymagaban? ---

  Nezzuk meg egy egyszeru peldat. Tegyuk fel, hogy van egy regisztracios
  formunk, es a backendenk elvarja a kovetkezo adatokat:
*/

interface RegisztraciosAdatok {
  felhasznalonev: string;
  email: string;
  jelszo: string;
  eletkor: number;
}

// Ez forditaskor tokeletesen mukodik:
const joBemenet: RegisztraciosAdatok = {
  felhasznalonev: "janos42",
  email: "janos@pelda.hu",
  jelszo: "TitkoS123!",
  eletkor: 28,
};

// De runtime-ban barmi johet. Kepzeldd el, hogy ez erkezik HTTP-n:
const amiTenylegJon: unknown = JSON.parse(
  '{"felhasznalonev": "", "email": "nemisemail", "jelszo": "1", "eletkor": -5}'
);

// Ha ezt egyszeruen "as RegisztraciosAdatok"-kent kezeljuk,
// a fordito nem szol, de az adatunk ervenytelen:
// ures nev, rossz email, rovidke jelszo, negativ eletkor.


/* --- 2. Runtime validacio Zod-dal ---

  A Zod lehetove teszi, hogy a TypeScript tipust es a runtime ellenorzest
  egyetlen helyen definiald. Igy nem fordulhat elo, hogy a tipus es a
  validacio "szetetcsusznak" -- mindig szinkronban maradnak.
*/

const RegisztraciosSchema = z.object({
  felhasznalonev: z
    .string()
    .min(3, "A felhasznalonev legalabb 3 karakter legyen")
    .max(30, "A felhasznalonev maximum 30 karakter lehet")
    .regex(
      /^[a-zA-Z0-9_]+$/,
      "A felhasznalonev csak betut, szamot es alahuzast tartalmazhat"
    ),

  email: z
    .string()
    .email("Ervenyes email cimet adj meg"),

  jelszo: z
    .string()
    .min(8, "A jelszo legalabb 8 karakter legyen")
    .regex(/[A-Z]/, "Legalabb egy nagybetut tartalmazzon")
    .regex(/[0-9]/, "Legalabb egy szamot tartalmazzon")
    .regex(/[^a-zA-Z0-9]/, "Legalabb egy specialis karaktert tartalmazzon"),

  eletkor: z
    .number()
    .int("Az eletkor egesz szam legyen")
    .min(13, "Legalabb 13 evesnek kell lenni")
    .max(120, "Az eletkor nem lehet tobb mint 120"),
});

// A Zod-bol kinyerheto a TypeScript tipus is -- igy egy helyen van minden:
type ValidRegisztraciosAdatok = z.infer<typeof RegisztraciosSchema>;

// Hasznalat:
function regisztracio(bemenet: unknown): void {
  const eredmeny = RegisztraciosSchema.safeParse(bemenet);

  if (!eredmeny.success) {
    console.log("Validacios hibak:");
    eredmeny.error.errors.forEach((hiba) => {
      console.log(`  - ${hiba.path.join(".")}: ${hiba.message}`);
    });
    return;
  }

  // Itt az eredmeny.data mar GARANTALTAN megfelel a schemanak
  const adat: ValidRegisztraciosAdatok = eredmeny.data;
  console.log(`Sikeres regisztracio: ${adat.felhasznalonev}`);
}

// Proba rossz adattal:
regisztracio({
  felhasznalonev: "",
  email: "nemisemail",
  jelszo: "1",
  eletkor: -5,
});


/* --- 3. SQL injection vedelem ---

  Az SQL injection az egyik legoregebb es legelterjedtebb tamadasi forma.
  A lenyege egyszeru: ha a felhasznaloi bemenetet kozvetlenul illeszted
  be egy SQL lekerdezesbe, a tamado sajat SQL kodot futtathat az
  adatbazisodon.

  Fontos: ez nem TypeScript-specifikus problema, de a TypeScript segithet
  abban, hogy a kodod strukturaja rakenyszerlssen a biztonsagos megoldasra.
*/

// ROSSZ -- kozvetlenul osszefuzott SQL (SOHA NE CSINALDD!)
function keressFelhasznalotUnsafe(felhasznalonev: string): string {
  // Ha a felhasznalonev ez: ' OR '1'='1' --
  // Akkor az SQL ez lesz: SELECT * FROM users WHERE username = '' OR '1'='1' --'
  // Ez visszaadja az OSSZES felhasznalot!
  const sql = `SELECT * FROM users WHERE username = '${felhasznalonev}'`;
  return sql; // Demonstracios celbol visszaadjuk a stringet
}

console.log("\n--- SQL Injection pelda ---");
console.log("Normal hasznalat:", keressFelhasznalotUnsafe("janos"));
console.log("Tamadas:", keressFelhasznalotUnsafe("' OR '1'='1' --"));

// JO -- parametrizalt lekerdezes (peldakent, mintha adatbazis klienst hasznalnank)
function keressFelhasznalotSafe(felhasznalonev: string): { query: string; params: string[] } {
  // A parameterek kulon mennek -- az adatbazis driver gondoskodik a helyes escapelasrol
  return {
    query: "SELECT * FROM users WHERE username = $1",
    params: [felhasznalonev],
  };
}


/* --- 4. XSS (Cross-Site Scripting) vedelem ---

  Az XSS tamadas lenyege, hogy a tamado JavaScript kodot csempesz be
  az oldaladba, ami a latogato bongeszoooben fut le. Peldaul ha egy
  kommentben ez all: <script>alert('hackelve')</script>, es te ezt
  valtozatlanul megjelenited, a script lefut minden latogato gepen.

  A vedelem: minden felhasznaloi bemenetet sanitizalni (megtisztitani)
  kell, mielott megjelenited.
*/

// Egyszeru HTML sanitizalas (alapveto vedelem)
function sanitizeHtml(bemenet: string): string {
  const csere: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#x27;",
    "/": "&#x2F;",
  };

  return bemenet.replace(/[&<>"'/]/g, (karakter) => csere[karakter] || karakter);
}

console.log("\n--- XSS vedelem pelda ---");
const rosszindulatuBemenet = '<script>document.cookie</script>';
console.log("Eredeti:", rosszindulatuBemenet);
console.log("Sanitizalt:", sanitizeHtml(rosszindulatuBemenet));
// Eredmeny: &lt;script&gt;document.cookie&lt;&#x2F;script&gt;
// Ez mar nem fut le mint script, csak szovegkent jelenik meg


/* --- 5. Bovitett validacios mintak ---

  A valosagban a validaciot erdemes retegekre bontani. Eloszor a nyers
  formatum (string, szam, stb.), aztan az uzleti szabalyok (egyedi
  felhasznalonev, ervenyes email domain, stb.).
*/

// Peldaa: API endpoint validacios schema
const TermekLetrehozasSchema = z.object({
  nev: z
    .string()
    .min(1, "A termeknev nem lehet ures")
    .max(200, "A termeknev maximum 200 karakter")
    .transform((nev) => sanitizeHtml(nev.trim())),

  ar: z
    .number()
    .positive("Az ar pozitiv szam legyen")
    .max(99999999, "Az ar tullepte a maximumot"),

  leiras: z
    .string()
    .max(5000, "A leiras maximum 5000 karakter")
    .optional()
    .transform((leiras) => (leiras ? sanitizeHtml(leiras.trim()) : undefined)),

  kategoriak: z
    .array(z.string().min(1).max(50))
    .min(1, "Legalabb egy kategoriat adj meg")
    .max(10, "Maximum 10 kategoria adhato meg"),
});

// Tipizalt valasz objektum Zod-dal
const ApiHibaSchema = z.object({
  kod: z.number(),
  uzenet: z.string(),
  reszletek: z.array(z.string()).optional(),
});

type ApiHiba = z.infer<typeof ApiHibaSchema>;

function keszitsHibaValaszt(hibak: z.ZodError): ApiHiba {
  return {
    kod: 400,
    uzenet: "Ervenytelen bemenet",
    reszletek: hibak.errors.map(
      (h) => `${h.path.join(".")}: ${h.message}`
    ),
  };
}


/* --- Osszefoglalas ---

  A runtime validacio nem opcionallis lepes -- a biztonsagos backend
  fejlesztes alapvetoe resze. A TypeScript tipusrendszere es a Zod
  egyutt nagyon eros kombinaciot alkot:

  - A TypeScript forditas idoben veedi meg a kododat
  - A Zod futas idoben vedi meg a felhasznaloktol es tamadoktol
  - Az SQL injection ellen parametrizalt lekerdezeseket hasznalj
  - Az XSS ellen sanitizald a felhasznaloi bemenetet
  - A validacios hibakat mindig ertelmesen kommunikald a kliens fele

  A kovetkezo fajlban megnezzuk, hogyan kezeljuk biztonsagosan a
  jelszavakat es az autentikacios tokeneket.
*/

export { RegisztraciosSchema, sanitizeHtml, keszitsHibaValaszt };
