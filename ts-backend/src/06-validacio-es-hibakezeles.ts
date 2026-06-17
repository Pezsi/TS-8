/*
  Validacio es hibakezeles -- az API veedelmi vonalai

  Ha egy dolgot kell megjegyezni a backend fejlesztesrol, az ez:
  SOHA ne bizz meg a kliensben. Barmi, ami a klienstol erkezik
  (request body, URL parameterek, headerek), potencialisan hibas
  vagy rosszindulatu.

  A validacio es a hibakezelees ket kulon, de osszefuggo tema:
  - Validacio: ellenorizni, hogy a bemenet megfelel-e az elvarasoknak
  - Hibakkezelees: mit csinalunk, ha nem felel meg (vagy mas hiba tortenik)

  Ebben a fajlban megnezzuk, hogyan csinaljuk mindkettot profi modon.
*/

import { z } from "zod";
import { Request, Response, NextFunction, Router } from "express";


/* --- 1. A DTO pattern ---

  A DTO (Data Transfer Object) egy olyan objektum, ami pontosan
  leirja, milyen adatot varunk. A TypeScript-ben a Zod schemak
  toltik be a DTO szerepet: definiaaljak az adatszerkezetet ES
  validaaljak is egyben.

  Miert jo ez? Mert egyetlen helyen van a tipus es a validacio.
  Nem csuszhattnak szet: ha valtozik a szerkezet, a tipus es
  az ellenorzes automatikusan egyutt valtozik.
*/

// Felhasznalo letrehozas DTO
const FelhasznaloLetrehozasDTO = z.object({
  nev: z
    .string({ required_error: "A nev megadasa kotelezo" })
    .min(2, "A nev legalabb 2 karakter")
    .max(100, "A nev maximum 100 karakter")
    .trim(),

  email: z
    .string({ required_error: "Az email megadasa kotelezo" })
    .email("Ervenyes email cimet adj meg")
    .toLowerCase()
    .trim(),

  jelszo: z
    .string({ required_error: "A jelszo megadasa kotelezo" })
    .min(8, "A jelszo legalabb 8 karakter")
    .max(128, "A jelszo maximum 128 karakter"),
});

// A tipus a schema-bol szarmazik -- egyetlen forras, nincs duplikalas
type FelhasznaloLetrehozasInput = z.infer<typeof FelhasznaloLetrehozasDTO>;

// Felhasznalo frissites DTO -- minden mezo opcionallis
const FelhasznaloFrissitesDTO = z.object({
  nev: z.string().min(2).max(100).trim().optional(),
  email: z.string().email().toLowerCase().trim().optional(),
});

type FelhasznaloFrissitesInput = z.infer<typeof FelhasznaloFrissitesDTO>;

// Cikk letrehozas DTO
const CikkLetrehozasDTO = z.object({
  cim: z
    .string()
    .min(3, "A cim legalabb 3 karakter")
    .max(200, "A cim maximum 200 karakter")
    .trim(),

  tartalom: z
    .string()
    .min(10, "A tartalom legalabb 10 karakter")
    .max(50000, "A tartalom maximum 50000 karakter"),

  cimkek: z
    .array(z.string().min(1).max(30))
    .max(10, "Maximum 10 cimke")
    .optional()
    .default([]),
});


/* --- 2. Validacios middleware ---

  A validaciot erdemes middleware-kent megvalositani, igy
  ujrahasznalhhato es a route handler-ekbol kiszorul.
*/

// Generikus validacios middleware gyarto fuggveny
function validald(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const eredmeny = schema.safeParse(req.body);

    if (!eredmeny.success) {
      const hibak = eredmeny.error.errors.map((h) => ({
        mezo: h.path.join("."),
        uzenet: h.message,
      }));

      res.status(400).json({
        hiba: "Validacios hiba",
        reszletek: hibak,
      });
      return;
    }

    // A validalt (es transzformalt!) adatot visszatesszuk a body-ba
    // Igy a route handler mar a tiszta adatot kapja
    req.body = eredmeny.data;
    next();
  };
}

// Query parameter validacios middleware
function validaldQuery(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const eredmeny = schema.safeParse(req.query);

    if (!eredmeny.success) {
      res.status(400).json({
        hiba: "Ervenytelen query parameterek",
        reszletek: eredmeny.error.errors.map((h) => ({
          mezo: h.path.join("."),
          uzenet: h.message,
        })),
      });
      return;
    }

    // Megjegyzes: a req.query-t nem irjuk felul, mert readonly.
    // Ehelyett a validalt adatot a req objektumra tesszuk.
    (req as Request & { validaltQuery: unknown }).validaltQuery = eredmeny.data;
    next();
  };
}

// URL parameter validacio
const IdParamSchema = z.object({
  id: z.string().regex(/^\d+$/, "Az ID pozitiv egesz szam legyen"),
});

function validaldParams(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const eredmeny = schema.safeParse(req.params);

    if (!eredmeny.success) {
      res.status(400).json({
        hiba: "Ervenytelen URL parameter",
        reszletek: eredmeny.error.errors.map((h) => h.message),
      });
      return;
    }

    next();
  };
}


/* --- 3. Custom Error osztalyok ---

  A hibakezeleshez erdemes sajat hiba osztaalyokat definialni.
  Igy a kovetkezo reteegek (middleware) tudjaak, milyen tipusu hiba
  tortent, es megfelelo valaszt tudnak kuldeni.
*/

class AppHiba extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly kod?: string
  ) {
    super(message);
    this.name = "AppHiba";
  }
}

// Specifikus hibatipusok -- megkoennyitik a hasznaalatot
class NemTalalhato extends AppHiba {
  constructor(eroforras: string, id?: number | string) {
    const uzenet = id
      ? `A(z) ${eroforras} (${id}) nem talalhato`
      : `A(z) ${eroforras} nem talalhato`;
    super(404, uzenet, "NEM_TALALHATO");
  }
}

class JogosulatlanHozzaferes extends AppHiba {
  constructor(uzenet = "Nincs jogosultsagod ehhez a muvelethez") {
    super(403, uzenet, "JOGOSULATLAN");
  }
}

class NincsBejelentkezve extends AppHiba {
  constructor() {
    super(401, "Bejelentkezes szukseges", "NINCS_BEJELENTKEZVE");
  }
}

class ValidaciosHiba extends AppHiba {
  constructor(
    public readonly hibak: Array<{ mezo: string; uzenet: string }>
  ) {
    super(400, "Validacios hiba", "VALIDACIOS_HIBA");
  }
}


/* --- 4. Kozpontos hibakezelo middleware ---

  Ez a middleware elkapja az osszes nem kezelt hibat. A kulonbozo
  hibatipusok alapjan megfelelo HTTP valaszt kuld.
*/

function kozpontiHibakezelo(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Naplozas -- minden hibat naplozunk, a reszletekkel egyutt
  console.error(`[HIBA] ${err.name}: ${err.message}`);
  if (!(err instanceof AppHiba)) {
    console.error(err.stack);
  }

  // Ismert alkalmazas-szintu hiba
  if (err instanceof ValidaciosHiba) {
    res.status(err.statusCode).json({
      hiba: err.message,
      kod: err.kod,
      reszletek: err.hibak,
    });
    return;
  }

  if (err instanceof AppHiba) {
    res.status(err.statusCode).json({
      hiba: err.message,
      kod: err.kod,
    });
    return;
  }

  // JSON parse hiba (hibas JSON a request body-ban)
  if (err instanceof SyntaxError && "body" in err) {
    res.status(400).json({
      hiba: "Ervenytelen JSON formatum",
      kod: "ERVENYTELEN_JSON",
    });
    return;
  }

  // Ismeretlen hiba -- NE kuldd ki a reszleteket production-ben
  const production = process.env.NODE_ENV === "production";
  res.status(500).json({
    hiba: production ? "Belso szerverhiba" : err.message,
    kod: "SZERVERHIBA",
  });
}


/* --- 5. Pelda hasznalat route-okban --- */

const router = Router();

// POST /api/felhasznalok -- validacioval
router.post(
  "/felhasznalok",
  validald(FelhasznaloLetrehozasDTO),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const adat: FelhasznaloLetrehozasInput = req.body;
      // Itt mar a validalt, tiszta adat van

      // Szimulalt ellenorzes: letezik-e mar ez az email?
      const letezik = false; // Valosagban adatbazis lekerdezes
      if (letezik) {
        throw new AppHiba(409, "Ez az email cim mar foglalt", "EMAIL_FOGLALT");
      }

      // Szimulalt letrehozas
      const ujFelhasznalo = { id: 1, ...adat };
      res.status(201).json({ adat: ujFelhasznalo });
    } catch (hiba) {
      next(hiba); // Tovabbadjuk a hibakezelo middleware-nek
    }
  }
);

// GET /api/felhasznalok/:id -- parameter validacioval
router.get(
  "/felhasznalok/:id",
  validaldParams(IdParamSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = parseInt(req.params.id, 10);
      // Szimulalt adatbazis lekerdezes
      const felhasznalo = null;

      if (!felhasznalo) {
        throw new NemTalalhato("felhasznalo", id);
      }

      res.json({ adat: felhasznalo });
    } catch (hiba) {
      next(hiba);
    }
  }
);


/* --- 6. Kulonbseg a kliens es szerver hiba kozott ---

  400-as hibak (4xx): a KLIENS hibazott. Rossz adatot kuldott,
  nincs bejelentkezve, nincs joga, stb. Ezek "varhatoak" -- a kod
  tud veluk mit kezdeni.

  500-as hibak (5xx): a SZERVER hibazott. Valami nem vart dolog
  tortent: adatbazis nem elerheto, programozasi hiba, stb.
  Ezek "nem varhatok" -- a ceel az, hogy minnel kevesebb legyen beloluk.

  Fontos: 500-as hibanal SOHA ne kuldd ki a reszleteket a kliensnek
  (biztonsagi kockazat), de MINDIG naplozd a reszleteket (hogy ki
  tudd nyomozni, mi tortent).
*/


/* --- Osszefoglalas ---

  - DTO pattern: Zod schema = tipus + validacio egyetlen helyen
  - Validaacios middleware: ujrahasznalhhato, tiszta route handler-ek
  - Custom Error osztaalyok: kuulonbozo hibatipusok megkulonboztetese
  - Kozponti hibakezelo: egyetlen helyen kezeli az osszes hibat
  - 4xx = kliens hiba, 5xx = szerver hiba
  - Production-ben: ne kuldd ki a belso hiba reszleteit

  A kovetkezo fajlban az autentikaaciot nezzuk meg.
*/

export {
  validald,
  validaldQuery,
  validaldParams,
  kozpontiHibakezelo,
  AppHiba,
  NemTalalhato,
  JogosulatlanHozzaferes,
  NincsBejelentkezve,
  ValidaciosHiba,
  FelhasznaloLetrehozasDTO,
  CikkLetrehozasDTO,
};
