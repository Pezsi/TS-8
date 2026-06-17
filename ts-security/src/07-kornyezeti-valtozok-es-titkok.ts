/*
  Kornyezeti valtozok es titkok kezelese

  Szinte minden alkalmazasnak vannak "titkai": adatbazis jelszo, API kulcsok,
  JWT secret, kulso szolgaltatasok tokenei. Ezeket az adatokat SOHA nem szabad
  a forraskkodba irni. Miert?

  1. Ha a forraskoood Git-ben van (es az), a titkok bekerulnek a verziokovetoobe.
     Meg ha torlod oket egy kesobbi commitban, a regi commitban meg ott lesznek.
     Es ha a repo barmikoris publikus lesz (vagy ha valaki hozzafer), a titkok
     kiszivaarognak.

  2. Kulonbozo kornyezeteknek (fejlesztes, tesztteles, production) kulonbozo
     titkokra van szuksege. Ha a kodba van egtve, nem tudod konnyen cserelni.

  3. A titkok a koddal egyutt masolodnak minden fejleszto gepere, a CI/CD
     rendszerbe, mindenhova. Minel tobb helyen vannak, annal nagyobb az
     eseelye a szivargasnak.

  A megoldas: kornyezeti valtozok (environment variables). A titkok a
  futtatasi kornyezetben vannak, nem a kodban. Fejleszteshez .env fajlokat
  hasznalunk, production-ben a hosztolo platform kezeli oket.
*/

import { z } from "zod";


/* --- 1. .env fajlok es a dotenv konyvtar ---

  A .env fajl egy egyszeru szoveges fajl, ami kulcs=ertek parokat
  tartalmaz. A dotenv konyvtar betolti ezeket a process.env objektumba.

  Pelda .env fajl tartalma:
  DATABASE_URL=postgresql://user:password@localhost:5432/mydb
  JWT_SECRET=egy-nagyon-hosszu-veletlenszeru-string
  PORT=3000
  NODE_ENV=development
*/

// FONTOS: a .env fajl NEM kerul a Git-be!
// A .gitignore fajlban kell lennie egy ".env" sornak.
// Helyette keszitsz egy .env.example fajlt, ami a szukseges valtozok
// neveit tartalmazza, de az ertekek helyett peldakat:
//
// .env.example:
// DATABASE_URL=postgresql://user:password@localhost:5432/mydb
// JWT_SECRET=ide-irj-egy-random-stringet
// PORT=3000
// NODE_ENV=development


/* --- 2. Miert nem eleg a process.env onmagaban? ---

  A process.env minden erteke string | undefined tipusu. Ez azt jelenti,
  hogy ha megprobalod hasznalni a process.env.PORT-ot, nem tudod,
  hogy az letezik-e, es ha letezik, string-e ami szamma alakithato.

  Ez pontosan az a helyzet, amikor a Zod nagyon hasznos: definialhatsz
  egy schemat a vart kornyezeti valtozokhoz, es az alkalmazas indulaskor
  azonnal kiderul, ha valami hianyzik vagy hibas.
*/

// ROSSZ -- kornyezeti valtozok ellenorzes nelkul
function getConfigUnsafe() {
  return {
    port: parseInt(process.env.PORT || "3000", 10),
    dbUrl: process.env.DATABASE_URL!, // A "!" hazugsag -- lehet undefined
    jwtSecret: process.env.JWT_SECRET || "default-secret", // Veszelyes default!
  };
}
// Problemak:
// - Ha DATABASE_URL nincs beallitva, undefined-dal probal csatlakozni
// - A "default-secret" production-ben katasztrofa -- barki generalhat tokeneket
// - Ha PORT nem szam, NaN lesz


// JO -- Zod schema a kornyezeti valtozokhoz
const KornyezetiValtozokSchema = z.object({
  // Kotelezo valtozok -- ha hianyzik, az alkalmazas nem indul el
  DATABASE_URL: z
    .string()
    .url("A DATABASE_URL ervenyes URL legyen")
    .startsWith("postgresql://", "Csak PostgreSQL tamogatott"),

  JWT_SECRET: z
    .string()
    .min(32, "A JWT_SECRET legalabb 32 karakter legyen")
    .refine(
      (s) => !/^(secret|titkos|jelszo|password|default)/i.test(s),
      "A JWT_SECRET ne legyen kiszamithato alapertelmezett ertek"
    ),

  // Valtozo alapertelmezett ertekkel
  PORT: z
    .string()
    .regex(/^\d+$/, "A PORT szam legyen")
    .transform(Number)
    .pipe(z.number().min(1).max(65535))
    .default("3000"),

  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),

  // Opcionalis valtozok
  REDIS_URL: z
    .string()
    .url()
    .optional(),

  LOG_LEVEL: z
    .enum(["debug", "info", "warn", "error"])
    .default("info"),
});

// Tipus kinyeresee a schema-bol
type KornyezetiValtozok = z.infer<typeof KornyezetiValtozokSchema>;


/* --- 3. Konfiguracio betoltese es validalasa ---

  Az alkalmazas indulaskor azonnal validalnunk kell a konfiguracioot.
  Ha valami hianyzik vagy hibas, jobb ha az alkalmazas el sem indul,
  minthogy futas kozben szalljon el.

  Ezt "fail fast" elvenek hivjak: ha gond van, azonnal jelezd, ne
  varj vele.
*/

function toltsdBeAKonfiguraciot(): KornyezetiValtozok {
  // Production-ben a dotenv-et nem feltetlenul kell hasznalni,
  // mert a hosztolo platform allitja be a valtozokat.
  // Fejlesztesben viszont a .env fajlbol toltjuk be.
  if (process.env.NODE_ENV !== "production") {
    // A dotenv-et dinamikusan importalnank, de itt demonstracio celbol
    // elhagyjuk a tenyleges importot.
    // require("dotenv").config();
  }

  const eredmeny = KornyezetiValtozokSchema.safeParse(process.env);

  if (!eredmeny.success) {
    console.error("Konfiguracios hibak:");
    eredmeny.error.errors.forEach((hiba) => {
      console.error(`  - ${hiba.path.join(".")}: ${hiba.message}`);
    });
    // Az alkalmazas NEM indulhat el hibas konfiguracioval
    process.exit(1);
  }

  return eredmeny.data;
}


/* --- 4. Konfiguracio hasznalata a kodban ---

  A beolvasott es validalt konfiguracioot egyetlen helyen taroljuk,
  es onnan importalja mindenki. Igy garantalt, hogy:
  - Mindenhol validalt adatot hasznalunk
  - Nem kell minden fajlban ujra process.env-hez nyulni
  - Tipusbiztos hozzaferes van minden konfiguracios ertekhez
*/

// Egyszeres betoltes -- singleton pattern
let _config: KornyezetiValtozok | null = null;

function getConfig(): KornyezetiValtozok {
  if (!_config) {
    _config = toltsdBeAKonfiguraciot();
  }
  return _config;
}

// Hasznalat:
// const config = getConfig();
// const app = express();
// app.listen(config.PORT, () => {
//   console.log(`Szerver fut a ${config.PORT} porton`);
//   console.log(`Kornyezet: ${config.NODE_ENV}`);
// });


/* --- 5. Titkok rotalaasa es kezelese ---

  A titkok nem orok ervenyugyuek. Fontos, hogy:
  - Rendszeresen csereld a titkokat (kulonosen ha valaki elhagyja a csapatot)
  - Ha gyanitod, hogy egy titok kiszivargott, azonnal csereld
  - Production-ben titkkezeloot hasznalj (AWS Secrets Manager, HashiCorp Vault)
  - A CI/CD pipeline-ban a titkokat a platform "secrets" funkciojaaval kezeld
*/


/* --- 6. .gitignore beallitasa ---

  Ez trivialisnak tunhet, de az egyik leggyakoribb hiba, hogy a .env
  fajl bekerul a Git-be. Ez igazaabol az elso dolog, amit egy uj
  projektnel be kell allitani.
*/

const gitignoreTartalom = `
# Kornyezeti valtozok -- SOHA ne keruljenek a repo-ba
.env
.env.local
.env.production
.env.*.local

# Node
node_modules/
dist/

# IDE
.vscode/
.idea/

# OS
.DS_Store
Thumbs.db

# Logok
*.log
npm-debug.log*
`;

console.log("Ajanlott .gitignore tartalom:");
console.log(gitignoreTartalom);


/* --- 7. Mi a teendo, ha mar bekeruult egy titok a Git-be? ---

  Ha veletlenul commitoltad egy titkot, a torles egy uj committal
  NEM eleg! A regi commit meg ott van a torteenetben.

  Lepesek:
  1. Azonnal csereld le a kompromittalodott titkot (uj jelszo, uj API kulcs)
  2. A Git tortenetet is meg kell tisztitani: git filter-branch vagy BFG Repo Cleaner
  3. Force push (ha tavoli repo-ba is felkerult)
  4. Ertesitsd a csapatodat, hogy frissitsek a helyi repo-jukat
  5. Ha publikus repo volt, tekintsd a titkot vegleg kompromittalodottnak

  A legjobb vedelem: megelozzzes. .gitignore, pre-commit hook,
  es a csapat oktatasa.
*/


/* --- Osszefoglalas ---

  - Titkokat SOHA ne irj a forraskkodba
  - Hasznalj .env fajlokat fejleszteshez, platform-szintu valtozokat production-hoz
  - A .env fajl MINDIG legyen a .gitignore-ban
  - Validald a kornyezeti valtozokat az alkalmazas indulaskor (Zod!)
  - Ha egy titok kiszivargott, azonnal csereld le
  - Production-ben hasznalj titokkkezelot (Secrets Manager, Vault)

  Ezzel a TypeScript Security oktatoanyag veget ert. A legfontosabb
  tanulsag: a biztonsag nem egy kulon feladat, amit a vegeen csinalsz meg.
  A biztonsag a fejlesztes szerves resze, ami minden sornal, minden
  dontesnel jelen van. Es a TypeScript tipusrendszere egy kivaalo
  eszkoz ahhoz, hogy a biztonsagos megoldasok a termeszetes, egyszeru
  utat jelentsek.
*/

export { getConfig, KornyezetiValtozokSchema };
export type { KornyezetiValtozok };
