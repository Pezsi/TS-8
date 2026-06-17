/*
  Adatbazis kezeles -- Prisma ORM

  Eddig in-memory tomboket hasznaltunk "adatbaziskent". Ez fejlesztesre
  jo, de nyilvan nem alkalmas valos alkalmazasokhoz: ha a szerver ujraindul,
  minden adat elveszik.

  A valos alkalmazasok adatbazist hasznalnak. De hogyan kommunikaal a
  TypeScript kodod az adatbazissal? Harom fo megkozelites letezik:

  1. Raw SQL: kozvetlenul SQL lekerdezeseket irsz stringkent.
     Elony: teljes kontroll. Hatrany: nincs tipusellenorzes, konnyu
     hibat ejteni, SQL injection veszelye.

  2. Query Builder (pl. Knex): JavaScript fuggvenyekkel epitesz
     SQL lekerdezeseket. Jobb, mint a nyers SQL, de meg mindig
     reszben keezi munka.

  3. ORM (pl. Prisma, TypeORM): az adatbazis tablaakat TypeScript
     osztaalyokkent/tipusokent kezeled. A legmagasabb szintu
     absztrakcio.

  Ebben a fajlban a Prisma-t hasznaljuk, ami a legmodernebb es
  leginkabb TypeScript-baraat ORM a Node.js vilagban.
*/


/* --- 1. Mi a Prisma es miert jo? ---

  A Prisma harom fo reszbol all:

  1. Prisma Schema: egy deklarativ fajl, amiben leirod az adatbazis
     szerkezetet. Ebbol generaalja a Prisma az adatbazis migraaciokat
     es a TypeScript tipusokat is.

  2. Prisma Client: egy automatikusan generaalt, tipusbiztos adatbazis
     kliens. Minden lekerdezes tipusellenorzott -- ha a schema szerint
     a "nev" mezo string, akkor a Prisma Client sem engedi, hogy szamot
     adj at.

  3. Prisma Migrate: adatbazis migracciok kezelese. Amikor modositod
     a schemat, a Prisma generalja a szukseges SQL-t a valtozashoz.

  Miert jobb, mint a tobbi ORM?
  - A schema egy helyen definiaalja az egesz adatbazis szerkezetet
  - A generaalt kliens 100%-ban tipusbiztos
  - Az IntelliSense tuukrozi az adatbazis szerkezetet
  - A migraaciok automatikusak es verziokovetettek
*/


/* --- 2. Prisma Schema pelda ---

  A Prisma Schema a prisma/schema.prisma fajlban van.
  Lassuk, hogyan nez ki egy egyszeru blog alkalmazas schemaja:
*/

const schemaPelda = `
// prisma/schema.prisma

// Adatbazis kapcsolat konfiguracio
// A DATABASE_URL kornyezeti valtozot hasznalja -- soha ne irj
// bele jelszot kozvetlenul!
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// Generatoor beallitas -- ez mondja meg a Prisma-nak, hogy
// generaaljon TypeScript klienst
generator client {
  provider = "prisma-client-js"
}

// MODELLEK -- ezek az adatbazis tablak

model Felhasznalo {
  id          Int       @id @default(autoincrement())
  email       String    @unique
  nev         String
  jelszoHash  String    @map("jelszo_hash")
  szerep      Szerep    @default(FELHASZNALO)
  letrehozva  DateTime  @default(now()) @map("letrehozva")
  modositva   DateTime  @updatedAt @map("modositva")

  // Relaciok
  cikkek      Cikk[]
  kommentek   Komment[]

  // Tabla nev az adatbazisban (snake_case konvencio)
  @@map("felhasznalok")
}

model Cikk {
  id          Int       @id @default(autoincrement())
  cim         String
  tartalom    String
  publikalt   Boolean   @default(false)
  letrehozva  DateTime  @default(now())
  modositva   DateTime  @updatedAt

  // Kulso kulcs -- a szerzo felhasznalo
  szerzoId    Int       @map("szerzo_id")
  szerzo      Felhasznalo @relation(fields: [szerzoId], references: [id])

  kommentek   Komment[]

  @@map("cikkek")
}

model Komment {
  id          Int       @id @default(autoincrement())
  tartalom    String
  letrehozva  DateTime  @default(now())

  cikkId      Int       @map("cikk_id")
  cikk        Cikk      @relation(fields: [cikkId], references: [id])

  szerzoId    Int       @map("szerzo_id")
  szerzo      Felhasznalo @relation(fields: [szerzoId], references: [id])

  @@map("kommentek")
}

enum Szerep {
  ADMIN
  MODERATOR
  FELHASZNALO
}
`;

console.log("--- Prisma Schema pelda ---");
console.log("A schema.prisma fajl az adatbazis szerkezetet irja le.");
console.log("Lasd a reszleteket a kod kommentjeiben.\n");


/* --- 3. Prisma Client hasznalata ---

  Miutan a schema kesz es a migraaciok lefutottak, a Prisma generaal
  egy tipusbiztos klienst. Nezzuk, hogyan hasznaljuk:
*/

// A valosagban igy importalod:
// import { PrismaClient } from "@prisma/client";
// const prisma = new PrismaClient();

// Az alabbi peldak mutatjak, hogyan nez ki a Prisma CRUD:

// Demonstracios tipusok (a valosagban a Prisma generaalja ezeket)
interface PrismaFelhasznalo {
  id: number;
  email: string;
  nev: string;
  szerep: string;
  letrehozva: Date;
}

interface PrismaCikk {
  id: number;
  cim: string;
  tartalom: string;
  szerzoId: number;
  publikalt: boolean;
  letrehozva: Date;
}

// CREATE -- uj rekord letrehozasa
async function hozzFelhasznalot(): Promise<void> {
  // const felhasznalo = await prisma.felhasznalo.create({
  //   data: {
  //     email: "kovacs.peter@pelda.hu",
  //     nev: "Kovacs Peter",
  //     jelszoHash: "bcrypt-hash-ide",
  //     // A szerep alapertelmezetten FELHASZNALO (a schema-ban definialtuk)
  //   },
  // });
  // console.log("Letrehozva:", felhasznalo);

  // A Prisma Client tipusellenorzott:
  // - Ha kihagyod a kotelezo "email" mezot -> fordiatasi hiba
  // - Ha szamot adsz meg a "nev" mezobe -> forditasi hiba
  // - A "letrehozva" es "modositva" automatikus

  console.log("Felhasznalo letrehozasa (Prisma pelda)");
}

// READ -- adatok lekerdezese
async function keresdMegACikkeket(): Promise<void> {
  // Osszes publikalt cikk, a szerzo nevevel egyutt
  // const cikkek = await prisma.cikk.findMany({
  //   where: {
  //     publikalt: true,
  //   },
  //   include: {
  //     szerzo: {
  //       select: {
  //         nev: true,
  //         email: true,
  //       },
  //     },
  //   },
  //   orderBy: {
  //     letrehozva: "desc",
  //   },
  //   take: 20,  // Limit
  //   skip: 0,   // Offset
  // });

  // Egy konkret cikk ID alapjan
  // const cikk = await prisma.cikk.findUnique({
  //   where: { id: 42 },
  // });

  // Elso talalat, ami megfelel
  // const cikk = await prisma.cikk.findFirst({
  //   where: {
  //     cim: { contains: "TypeScript" },
  //   },
  // });

  console.log("Cikkek lekerdezese (Prisma pelda)");
}

// UPDATE -- meglevo rekord modositasa
async function frissitsdACikket(): Promise<void> {
  // const frissitett = await prisma.cikk.update({
  //   where: { id: 42 },
  //   data: {
  //     cim: "Frissitett cim",
  //     publikalt: true,
  //   },
  // });

  console.log("Cikk frissitese (Prisma pelda)");
}

// DELETE -- rekord torlese
async function toroldACikket(): Promise<void> {
  // const torolt = await prisma.cikk.delete({
  //   where: { id: 42 },
  // });

  // Tobb rekord torlese egyszerre:
  // const toroltek = await prisma.cikk.deleteMany({
  //   where: {
  //     szerzoId: 5,
  //     publikalt: false,
  //   },
  // });

  console.log("Cikk torlese (Prisma pelda)");
}


/* --- 4. Relaciok es osszetett lekerdezesek ---

  A Prisma nagyon jol kezeli a relaciokat. Az include es select
  opciokkal pontosan megmondhatod, milyen kapcssolodo adatokat
  szeretnel betolteni.
*/

async function osszeteettLekerdezes(): Promise<void> {
  // Felhasznalo az osszes cikkevel es azok kommentjeivel
  // const felhasznalo = await prisma.felhasznalo.findUnique({
  //   where: { id: 1 },
  //   include: {
  //     cikkek: {
  //       where: { publikalt: true },
  //       include: {
  //         kommentek: {
  //           include: {
  //             szerzo: {
  //               select: { nev: true },
  //             },
  //           },
  //         },
  //       },
  //       orderBy: { letrehozva: "desc" },
  //     },
  //   },
  // });

  // Aggregacio:
  // const statisztika = await prisma.cikk.aggregate({
  //   _count: { id: true },
  //   where: { publikalt: true },
  // });

  console.log("Osszetett lekerdezes (Prisma pelda)");
}


/* --- 5. Migraciok ---

  Amikor modositod a schema.prisma fajlt, a Prisma generalja a
  szukseges SQL migracios fajlokat.

  Parancsok:
  - npx prisma migrate dev --name "leiras"  -- uj migracio (fejleszteshez)
  - npx prisma migrate deploy               -- migraciok futtatasa (production)
  - npx prisma db push                      -- gyors prototipus (nincs migracio fajl)
  - npx prisma generate                     -- kliens ujrageneraalasa
  - npx prisma studio                       -- vizualis adatbazis bongeszo
*/


/* --- 6. Connection pooling ---

  Production-ben fontos a connection pooling: nem nyitsz uj adatbazis
  kapcsolatot minden egyes kereshez, hanem egy "medencebol" (pool)
  veszel ki mar nyitott kapcsolatokat es hasznalat utan visszatesszed.

  A Prisma ezt automatikusan kezeli, de erdemes tudni rolaa es
  szukseeg eseten konfigurallni a medence meretet a connection
  string-ben.
*/

// A connection string-ben allithato:
// DATABASE_URL="postgresql://user:pass@host:5432/db?connection_limit=10&pool_timeout=20"


/* --- Osszefoglalas ---

  - A Prisma a legmodernebb TypeScript ORM
  - A schema.prisma fajl egyetlen helyen leirja az egesz adatbazist
  - A generaalt Prisma Client 100%-ban tipusbiztos
  - CRUD muveletekek: create, findMany, findUnique, update, delete
  - Relaciok: include es select opciokkal tolthetod be
  - Migraciok: prisma migrate dev/deploy
  - Connection pooling: a Prisma automatikusan kezeli

  A kovetkezo fajlban a validaciot es hibakezelest nezzuk meg reszletesen.
*/

export {
  hozzFelhasznalot,
  keresdMegACikkeket,
  frissitsdACikket,
  toroldACikket,
};
