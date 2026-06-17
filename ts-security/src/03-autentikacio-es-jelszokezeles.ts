/*
  Autentikacio es jelszokezeles -- hogyan taroljunk jelszavakat
  es hogyan igazoljuk a felhasznalok kileteet?

  Ez talan az egyik legkritikusabb biztonsagi tema. Ha rosszul kezeled
  a jelszavakat, egy adatszivargas eseten minden felhasznalod jelszava
  kompromittaloddhat. Ha rosszul implementalod az autentikaciot, a
  tamadok mas felhasznalok neveben lephetnek be.

  Eloszor megnezzuk a jelszokezeles helyes modjat, utana a JWT
  (JSON Web Token) alapu autentikaciot es a tipikus hibakat.
*/

import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";


/* --- 1. Miert nem szabad plain text jelszavakat tarolni? ---

  Ez trivialis kerdesnek tunhet, de erdemes megerteni, mi all mogotte.
  Ha az adatbazisodban sima szovegkent tarolod a jelszavakat, es
  tortenik egy adatbazis-szivargas (es tortenik -- ez nem "ha", hanem
  "mikor" kerdes), akkor MINDEN felhasznalod jelszava azonnal lathatova
  valik.

  Es mivel az emberek ujrahasznaljak a jelszavaikat, ezzel nemcsak
  a te rendszeredhez, hanem az email fiokjukhoz, bankjukhoz, mindenhova
  hozzaferest adsz a tamadoknak.
*/

// NAGYON ROSSZ -- SOHA ne tarold igy a jelszot
function mentsdElAJelszotUnsafe(jelszo: string): { hash: string } {
  return { hash: jelszo }; // Ez egyaltalan nem hash, ez maga a jelszo!
}


/* --- 2. Miert nem eleg az egyszeru hash? ---

  "Na jo, akkor hasheljem el!" -- gondolod. Es igaz, a hash egy
  egyiranyu fuggveny: a jelszobol kiszamolod a hash-t, de a hash-bol
  nem tudod visszafejteni a jelszot. Ez jo.

  De van egy problema: ha ket felhasznalonak ugyanaz a jelszava, akkor
  ugyanaz lesz a hash is. Es leteznek hatalmas elore kiszamolt tablak
  (rainbow tables), amik a leggyakoribb jelszavak hash-jeit tartalmazzak.
  Igy a tamado egyszeruen megkeresi a hash-t a tablaban es megvan a jelszo.

  A megoldas: salting. Minden jelszohoz hozzaadunk egy egyedi, veletlenszeru
  erteket (salt), es azt hasheljuk. Igy meg ha ket felhasznalonak ugyanaz
  is a jelszava, a hash kulonbozni fog.

  A bcrypt pont ezt csinalja automatikusan: generalja a salt-ot es
  olyan lassu hash algoritmust hasznal, ami nehezkesse teszi a
  brute force tamadast.
*/

// JO -- bcrypt hasznalata
const SALT_ROUNDS = 12;
// A SALT_ROUNDS erteke azt hataarozza meg, mennyire legyen "lassu" a hasheles.
// Magasabb ertek = lassabb = biztonsagosabb, de tobb CPU-t igenyel.
// 10-12 altalaban jo egyensuly.

async function hasheldAJelszot(jelszo: string): Promise<string> {
  const hash = await bcrypt.hash(jelszo, SALT_ROUNDS);
  return hash;
}

async function ellenorizzAJelszot(
  jelszo: string,
  taroltHash: string
): Promise<boolean> {
  const egyezik = await bcrypt.compare(jelszo, taroltHash);
  return egyezik;
}

// Pelda hasznalat:
async function jelszoDemo(): Promise<void> {
  const jelszo = "TitkoS123!";
  const hash = await hasheldAJelszot(jelszo);
  console.log("Eredeti jelszo:", jelszo);
  console.log("Bcrypt hash:", hash);
  // A hash valami ilyesmi lesz: $2b$12$LJ3m4ys3Lg...
  // Latod benne a "12"-t? Az a salt rounds szam.

  const helyesJelszo = await ellenorizzAJelszot("TitkoS123!", hash);
  console.log("Helyes jelszo egyezik?", helyesJelszo); // true

  const rosszJelszo = await ellenorizzAJelszot("RosszJelszo", hash);
  console.log("Rossz jelszo egyezik?", rosszJelszo); // false
}


/* --- 3. JWT (JSON Web Token) -- mi ez es hogyan mukodik? ---

  A JWT egy szabvanyos modszer arra, hogy a szerver es a kliens kozott
  biztonsagosan informaciot csereljetek. A leggyakoribb felhasznalasa
  az autentikacio: a felhasznalo bejelentkezik, kap egy tokent, es
  ezutan minden keresnel ezt a tokent kuldi a jelszo helyett.

  Egy JWT harom reszbol all, ponttal elvalasztva:
  - Header: milyen algoritmus van hasznalva (pl. HS256)
  - Payload: a tenyleges adatok (felhasznalo id, szerep, lejarati ido)
  - Signature: az elso ket resz alairt verzioja a titkos kulccsal

  Fontos megerteni: a payload NINCS titkositva! Barki el tudja olvasni
  (base64 kodolasu). A signature csak azt garantaalja, hogy a tartalmat
  nem masitottak meg. Ezert SOHA ne tegyel erzekeny adatot (jelszot,
  szemeelyes adatot) a tokenbe.
*/

// Token konfiguracio
interface TokenConfig {
  secret: string;
  lejaratPercben: number;
}

// ROSSZ konfiguracio -- tipikus hibak
const rosszConfig: TokenConfig = {
  secret: "titkos",         // Tul rovid es kiszamithato
  lejaratPercben: 0,         // Soha nem jar le -- veszelyes!
};

// JO konfiguracio
const joConfig: TokenConfig = {
  secret: "ez-egy-hosszu-es-veletlenszeru-kulcs-amit-kornyezeti-valtozobool-kellene-olvasni-32byte-minimum",
  lejaratPercben: 60,        // 1 ora utan lejar
};

// Token generalas
interface TokenPayload {
  felhasznaloId: number;
  szerep: string;
}

function generaljTokent(
  payload: TokenPayload,
  config: TokenConfig
): string {
  const token = jwt.sign(payload, config.secret, {
    expiresIn: `${config.lejaratPercben}m`,
    algorithm: "HS256",
  });
  return token;
}

// Token ellenorzes
function ellenorizzTokent(
  token: string,
  config: TokenConfig
): TokenPayload | null {
  try {
    const dekodolt = jwt.verify(token, config.secret) as TokenPayload;
    return dekodolt;
  } catch (hiba) {
    // A jwt.verify hibat dob ha:
    // - A token lejaart
    // - A signature nem egyezik (hamisitott token)
    // - A token formatuma ervenytelen
    return null;
  }
}


/* --- 4. Tipikus JWT hibak ---

  Ezek a hibak a valosagban is rendszeresen elofordulnak, meg
  tapasztalt fejlesztoknel is.
*/

// HIBA 1: Token a URL-ben
// SOHA ne kuld tokent URL parameterben, mert:
// - A bongeszooelozmenyek taroljaak
// - A szerver logok rogzitik
// - A proxy szerverek latjak
// ROSSZ: https://api.pelda.hu/profil?token=eyJhbG...
// JO: Authorization: Bearer eyJhbG... (HTTP header-ben)

// HIBA 2: Gyenge secret
// Ha a secret rovid vagy kiszamithato (pl. "secret", "123456"),
// a tamado brute force-olhatja es sajat tokeneket generaalhat.

// HIBA 3: Nincs lejarati ido
// Ha a token soha nem jar le, egy ellopott token orokre hasznalhato.
// Mindig allits be eesszeru lejaratot.

// HIBA 4: Tul sok adat a tokenben
// A token payload nyilvanos -- ne tegyel bele jelszot, bankszamla szamot,
// vagy barmilyen erzekeny adatot.

// Pelda a helyes login/regisztracio folyamatra
interface LoginKerelem {
  email: string;
  jelszo: string;
}

interface LoginValasz {
  sikeres: boolean;
  token?: string;
  hibauzenet?: string;
}

// Szimulalt felhasznalo-adatbazis
const felhasznalok = new Map<
  string,
  { id: number; email: string; jelszoHash: string; szerep: string }
>();

async function regisztracio(
  email: string,
  jelszo: string
): Promise<{ sikeres: boolean; uzenet: string }> {
  if (felhasznalok.has(email)) {
    return { sikeres: false, uzenet: "Ez az email cim mar foglalt" };
  }

  const jelszoHash = await hasheldAJelszot(jelszo);
  const ujId = felhasznalok.size + 1;

  felhasznalok.set(email, {
    id: ujId,
    email,
    jelszoHash,
    szerep: "felhasznalo",
  });

  return { sikeres: true, uzenet: "Sikeres regisztracio" };
}

async function bejelentkezes(kerelem: LoginKerelem): Promise<LoginValasz> {
  const felhasznalo = felhasznalok.get(kerelem.email);

  // Fontos: ne aruld el, hogy a felhasznalo nem letezik-e vagy a jelszo rossz-e.
  // Mindig ugyanazt az uzzenetet add, hogy a tamado ne tudja kideriteni,
  // mely email cimek regisztraltak a rendszerben.
  if (!felhasznalo) {
    return { sikeres: false, hibauzenet: "Hibas email vagy jelszo" };
  }

  const jelszoHelyes = await ellenorizzAJelszot(
    kerelem.jelszo,
    felhasznalo.jelszoHash
  );

  if (!jelszoHelyes) {
    return { sikeres: false, hibauzenet: "Hibas email vagy jelszo" };
  }

  const token = generaljTokent(
    { felhasznaloId: felhasznalo.id, szerep: felhasznalo.szerep },
    joConfig
  );

  return { sikeres: true, token };
}


/* --- Osszefoglalas ---

  - Jelszavakat MINDIG bcrypt-tel (vagy argon2-vel) hasheld, SOHA ne
    tarold oket sima szovegkent vagy egyszeru hash-sel
  - A salt rounds legyen legalabb 10-12
  - JWT tokeneknek MINDIG legyen lejarati idejuk
  - A JWT secret legyen hosszu es veletlenszeru
  - A tokent HTTP Authorization header-ben kuldd, ne URL-ben
  - A login hibauzenet ne arulja el, mi volt pontosan a hiba
  - A token payload-ba csak a legszuksegesebb adatot tedd

  A kovetkezo fajlban megnezzuk, hogyan valositjuk meg a
  jogosultsagkezelest (authorizaciot) a mar hitelesitett felhasznalok
  szamara.
*/

export {
  hasheldAJelszot,
  ellenorizzAJelszot,
  generaljTokent,
  ellenorizzTokent,
  bejelentkezes,
  regisztracio,
  jelszoDemo,
};
