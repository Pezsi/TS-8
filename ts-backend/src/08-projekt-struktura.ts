/*
  Projekt struktura -- hogyan szervezd a kodot egy valos alkalmazasban?

  Eddig minden egy fajlban volt: route, validacio, uzleti logika, adatbazis.
  Ez oktatasi celra tokeetees, de valos alkalmazasban gyorsan athatolhatatlan
  lenne. Egy 10.000 soros fajlt senki nem akar karbantartani.

  Ebben a fajlban megnezzuk a legelterjettebb backend projekt strukturat:
  a Controller-Service-Repository pattern-t. Ez nem az egyetlen megoldasas,
  de az egyik legkoennyebben ertheto es legszeelesebb korben hasznalt.
*/


/* --- 1. A harom reteg ---

  Controller (Vezerlo):
  - A HTTP keressel foglalkozik
  - Kiolvassa a request adatait (params, body, query)
  - Meghivja a megfelelo service fuggvenyt
  - Visszakuldi a valaszt a kliensnek
  - NEM tartalmaz uzleti logikat!

  Service (Szolgaltatas):
  - Az uzleti logika helye
  - Nem tud a HTTP-rol (nincs req, res)
  - Meghivja a repository-t az adatbazis muveletekhez
  - Validalja az uzleti szabalyokat
  - Pelda: "uj felhasznalo letrehozasa" = email egyediseeg ellenorzes +
    jelszo hasheles + adatbazisba mentes + email kuldees

  Repository (Tarolo):
  - Kizarolag adatbazis muveleteket vegez
  - Nem tud az uzleti logikarol
  - Egyszeru CRUD: letrehozas, olvasas, frissites, torles
  - Ha adatbazist cserelssz, csak ezt a reteget kell ujrairni
*/


/* --- 2. Mappaszerkezet --- */

// Egy valoos TypeScript backend projekt ajanlott szerkezete:
//
// ts-backend/
//   src/
//     modules/                 -- Funkcionalitas szerinti csoportositas
//       felhasznalo/
//         felhasznalo.controller.ts
//         felhasznalo.service.ts
//         felhasznalo.repository.ts
//         felhasznalo.dto.ts        -- Zod schemak (validacio + tipusok)
//         felhasznalo.routes.ts
//       cikk/
//         cikk.controller.ts
//         cikk.service.ts
//         cikk.repository.ts
//         cikk.dto.ts
//         cikk.routes.ts
//     middleware/
//       auth.middleware.ts
//       validation.middleware.ts
//       error-handler.middleware.ts
//     config/
//       env.ts                 -- Kornyezeti valtozok validalasa
//       database.ts            -- Adatbazis kapcsolat
//     types/
//       index.ts               -- Kozos tipusdefiniciok
//     app.ts                   -- Express alkalmazas osszekallitasa
//     server.ts                -- A szerver indlitasa
//   prisma/
//     schema.prisma
//   tests/
//     felhasznalo.test.ts
//     cikk.test.ts


/* --- 3. Pelda: Felhasznalo modul --- */

// --- felhasznalo.dto.ts ---
import { z } from "zod";

const FelhasznaloLetrehozasDTO = z.object({
  nev: z.string().min(2).max(100).trim(),
  email: z.string().email().toLowerCase().trim(),
  jelszo: z.string().min(8),
});

type FelhasznaloLetrehozasInput = z.infer<typeof FelhasznaloLetrehozasDTO>;

// --- felhasznalo.repository.ts ---
// Ez a reteg kozvetlenul az adatbazissal kommunikal.
// A valosagban Prisma Client-et hasznalnal.

interface FelhasznaloEntity {
  id: number;
  nev: string;
  email: string;
  jelszoHash: string;
  szerep: string;
  letrehozva: Date;
}

class FelhasznaloRepository {
  // A valosagban: constructor(private prisma: PrismaClient) {}

  async findById(id: number): Promise<FelhasznaloEntity | null> {
    // return this.prisma.felhasznalo.findUnique({ where: { id } });
    console.log(`[Repository] Felhasznalo keresese: ${id}`);
    return null; // Szimulalt
  }

  async findByEmail(email: string): Promise<FelhasznaloEntity | null> {
    // return this.prisma.felhasznalo.findUnique({ where: { email } });
    console.log(`[Repository] Felhasznalo keresese email alapjan: ${email}`);
    return null;
  }

  async create(adat: {
    nev: string;
    email: string;
    jelszoHash: string;
  }): Promise<FelhasznaloEntity> {
    // return this.prisma.felhasznalo.create({ data: adat });
    console.log(`[Repository] Felhasznalo letrehozasa: ${adat.email}`);
    return {
      id: 1,
      ...adat,
      szerep: "felhasznalo",
      letrehozva: new Date(),
    };
  }

  async update(
    id: number,
    adat: Partial<{ nev: string; email: string }>
  ): Promise<FelhasznaloEntity | null> {
    // return this.prisma.felhasznalo.update({ where: { id }, data: adat });
    console.log(`[Repository] Felhasznalo frissitese: ${id}`);
    return null;
  }

  async delete(id: number): Promise<void> {
    // await this.prisma.felhasznalo.delete({ where: { id } });
    console.log(`[Repository] Felhasznalo torlese: ${id}`);
  }
}


// --- felhasznalo.service.ts ---
// Az uzleti logika helye. Nem tud a HTTP-rol.

class FelhasznaloService {
  constructor(private repo: FelhasznaloRepository) {}

  async regisztracio(adat: FelhasznaloLetrehozasInput): Promise<FelhasznaloEntity> {
    // Uzleti szabaly: az email egyedi legyen
    const letezik = await this.repo.findByEmail(adat.email);
    if (letezik) {
      throw new Error("Ez az email cim mar foglalt");
    }

    // Jelszo hasheles
    // const jelszoHash = await bcrypt.hash(adat.jelszo, 12);
    const jelszoHash = `hashed_${adat.jelszo}`;

    // Letrehozas az adatbazisban
    const ujFelhasznalo = await this.repo.create({
      nev: adat.nev,
      email: adat.email,
      jelszoHash,
    });

    // Esetleg: email kuldees, naplozas, stb.
    console.log(`[Service] Regisztracio kesz: ${ujFelhasznalo.email}`);

    return ujFelhasznalo;
  }

  async profilLekerdezese(id: number): Promise<FelhasznaloEntity> {
    const felhasznalo = await this.repo.findById(id);
    if (!felhasznalo) {
      throw new Error("A felhasznalo nem talalhato");
    }
    return felhasznalo;
  }
}


// --- felhasznalo.controller.ts ---
// A HTTP keresek kezelese. Nem tartalmaz uzleti logikat.

import { Request, Response, NextFunction } from "express";

class FelhasznaloController {
  constructor(private service: FelhasznaloService) {}

  regisztracio = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const eredmeny = FelhasznaloLetrehozasDTO.safeParse(req.body);
      if (!eredmeny.success) {
        res.status(400).json({
          hiba: "Validacios hiba",
          reszletek: eredmeny.error.errors,
        });
        return;
      }

      const felhasznalo = await this.service.regisztracio(eredmeny.data);

      // Ne kuldd vissza a jelszoHash-t!
      res.status(201).json({
        adat: {
          id: felhasznalo.id,
          nev: felhasznalo.nev,
          email: felhasznalo.email,
        },
      });
    } catch (hiba) {
      next(hiba);
    }
  };

  profil = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = parseInt(req.params.id, 10);
      const felhasznalo = await this.service.profilLekerdezese(id);

      res.json({
        adat: {
          id: felhasznalo.id,
          nev: felhasznalo.nev,
          email: felhasznalo.email,
          szerep: felhasznalo.szerep,
        },
      });
    } catch (hiba) {
      next(hiba);
    }
  };
}


/* --- 4. Dependency Injection alapok ---

  Figyeld meg, hogy a fenti osztalyok a fuggossegeiket a konstruktorban
  kapjak meg. A FelhasznaloController fugg a FelhasznaloService-tol,
  a FelhasznaloService fugg a FelhasznaloRepository-tol.

  De egyiik sem hozza letre sajat maga a fuggoseget -- kivulrol kapja.
  Ezt hivjak Dependency Injection-nek (DI).

  Miert jo ez?
  - Tesztelehetoseg: teszteknel mock-olt fuggoseget adhatsz at
  - Rugalmassag: lecserelheted a repository-t (pl. mas adatbazisra)
  - Attekinthetoseg: vilagos, mi mitol fugg
*/

// Az osszeallitas egy helyen tortenik (altalaban app.ts-ben):
function hozzLetreFelhasznaloModult() {
  const repo = new FelhasznaloRepository();
  const service = new FelhasznaloService(repo);
  const controller = new FelhasznaloController(service);
  return { controller, service, repo };
}

// Route-ok:
// import { Router } from "express";
// const router = Router();
// const { controller } = hozzLetreFelhasznaloModult();
// router.post("/felhasznalok", controller.regisztracio);
// router.get("/felhasznalok/:id", authMiddleware, controller.profil);


/* --- 5. Kornyezeti konfiguraciooo --- */

// Fejlesztoi vs production beallitasok:
// A kornyezeti valtozok (lasd 07-es fejezet a security projektben)
// hatarrozzak meg, milyen modban fut az alkalmazas.

interface AppConfig {
  port: number;
  nodeEnv: "development" | "production" | "test";
  adatbazisUrl: string;
  jwtSecret: string;
  corsEredet: string[];
  naplozasSzint: string;
}

function getConfig(): AppConfig {
  const env = process.env.NODE_ENV || "development";

  return {
    port: parseInt(process.env.PORT || "3000", 10),
    nodeEnv: env as AppConfig["nodeEnv"],
    adatbazisUrl: process.env.DATABASE_URL || "postgresql://localhost:5432/dev",
    jwtSecret: process.env.JWT_SECRET || "CSAK_FEJLESZTESRE",
    corsEredet: env === "production"
      ? ["https://pelda.hu"]
      : ["http://localhost:3000", "http://localhost:5173"],
    naplozasSzint: env === "production" ? "info" : "debug",
  };
}


/* --- Osszefoglalas ---

  - Controller: HTTP kerest fogad, valaszt kuld. Nem tartalmaz uzleti logikat.
  - Service: uzleti logika. Nem tud a HTTP-rol.
  - Repository: adatbazis CRUD. Nem tud az uzleti logikarol.
  - Dependency Injection: fuggoseegek kivulrol erkeznek, nem belulrol jonnnek letre.
  - Modularis struktura: minden funkcionalitas kulon mappaban.
  - Kornyezeti konfiguracio: valtozok hatarozzak meg a mukodest.

  Az utolso fajlban a tesztelesst nezzuk meg.
*/

export {
  FelhasznaloRepository,
  FelhasznaloService,
  FelhasznaloController,
  hozzLetreFelhasznaloModult,
  getConfig,
};
