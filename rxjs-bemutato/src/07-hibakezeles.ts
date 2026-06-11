/**
 * ============================================================
 *  07 - HIBAKEZELÉS (Error Handling)
 * ============================================================
 *
 *  Az Observable stream-ekben a hibák alapértelmezetten
 *  LEÁLLÍTJÁK a stream-et. A hibakezelő operátorokkal
 *  elkaphatjuk és kezelhetjük a hibákat anélkül, hogy
 *  a stream megszakadna.
 *
 *  Az Observable 3 jelzése:
 *  - next(érték)   → következő érték ✓
 *  - error(hiba)   → hiba ✗ (leállítja a stream-et)
 *  - complete()    → vége ✓ (normális befejezés)
 *
 *  A hiba és complete KIZÁRJÁK egymást - vagy hiba, vagy complete.
 */

import { Observable, of, from, throwError, timer, interval, EMPTY } from "rxjs";
import {
  catchError,
  retry,
  retryWhen,
  map,
  tap,
  take,
  delay,
  switchMap,
  finalize,
  timeout,
  mergeMap,
} from "rxjs/operators";
import { fejlec, alfejlec, varakozas } from "./utils";

async function main() {
  // ============================================================
  // 1. Hiba az Observable-ben - Mi történik kezelés nélkül?
  // ============================================================
  fejlec("1. Hiba kezelés nélkül");

  /**
   * Ha error() hívódik, a stream AZONNAL leáll.
   * A complete() NEM hívódik meg hiba esetén.
   */

  const hibasStream$ = new Observable<number>((subscriber) => {
    subscriber.next(1);
    subscriber.next(2);
    subscriber.error(new Error("Valami elromlott!"));
    subscriber.next(3); // Ez már NEM fut le
    subscriber.complete(); // Ez sem
  });

  hibasStream$.subscribe({
    next: (v) => console.log(`  next: ${v}`),
    error: (err) => console.log(`  error: ${err.message}`),
    complete: () => console.log("  complete (ez nem jelenik meg)"),
  });

  // ============================================================
  // 2. catchError() - Hiba elkapása és kezelése
  // ============================================================
  alfejlec("2. catchError() - Hiba elkapása");

  /**
   * A catchError() elkapja a hibát és:
   * - Visszaadhat egy MÁSIK Observable-t (helyettesítő érték)
   * - Visszaadhat EMPTY-t (figyelmen kívül hagyás)
   * - Dobhat ÚJABB hibát (throwError)
   *
   * Bejövő:  --1--2--✗
   * catchError(() => of(99))
   * Kimenő:  --1--2--99--|
   */

  // 2a. Helyettesítő értékkel
  console.log("  2a. Helyettesítő érték:");
  hibasStream$
    .pipe(
      catchError((err) => {
        console.log(`    Hiba elkapva: ${err.message}`);
        return of(99); // Helyettesítő érték
      })
    )
    .subscribe({
      next: (v) => console.log(`    next: ${v}`),
      complete: () => console.log("    ✓ complete (most már lefut!)"),
    });

  // 2b. Hiba figyelmen kívül hagyása (EMPTY)
  console.log("\n  2b. Hiba figyelmen kívül hagyása:");
  hibasStream$
    .pipe(
      catchError(() => {
        console.log("    Hiba figyelmen kívül hagyva");
        return EMPTY; // Üres stream → azonnal complete
      })
    )
    .subscribe({
      next: (v) => console.log(`    next: ${v}`),
      complete: () => console.log("    ✓ complete"),
    });

  // 2c. Hiba átalakítása másik hibává
  console.log("\n  2c. Hiba átalakítása:");
  hibasStream$
    .pipe(
      catchError((err) => {
        return throwError(
          () => new Error(`Felhasználóbarát hiba: ${err.message}`)
        );
      })
    )
    .subscribe({
      next: (v) => console.log(`    next: ${v}`),
      error: (err) => console.log(`    Átalakított error: ${err.message}`),
    });

  // ============================================================
  // 3. retry() - Automatikus újrapróbálkozás
  // ============================================================
  alfejlec("3. retry() - Újrapróbálkozás");

  /**
   * A retry(n) hiba esetén ÚJRA feliratkozik az Observable-re,
   * legfeljebb n alkalommal.
   *
   * Tipikus felhasználás: instabil hálózati kérések,
   * időszakos API hibák.
   */

  let probalkozas = 0;

  const instabilApi$ = new Observable<string>((subscriber) => {
    probalkozas++;
    console.log(`    API hívás próbálkozás: #${probalkozas}`);

    if (probalkozas < 3) {
      subscriber.error(new Error(`Hálózati hiba (próba: ${probalkozas})`));
    } else {
      subscriber.next("Sikeres válasz!");
      subscriber.complete();
    }
  });

  instabilApi$
    .pipe(
      retry(3), // Maximum 3 újrapróbálkozás
      catchError((err) => {
        return of(`Végleg sikertelen: ${err.message}`);
      })
    )
    .subscribe({
      next: (v) => console.log(`    Eredmény: ${v}`),
      complete: () => console.log("    ✓ Kész"),
    });

  // ============================================================
  // 4. retry({ delay }) - Késleltetett újrapróbálkozás
  // ============================================================
  alfejlec("4. retry delay-jel - Késleltetett újrapróbálkozás");

  /**
   * Az RxJS 7+ retry operátora támogatja a delay opciót,
   * amellyel megadható az újrapróbálkozások közötti várakozás.
   *
   * Lehetőségek:
   * - delay: szám (fix késleltetés ms-ban)
   * - delay: függvény (dinamikus/exponenciális késleltetés)
   */

  let probe2 = 0;

  console.log("  Késleltetett retry (100ms-ként):");
  await new Promise<void>((resolve) => {
    const instabil2$ = new Observable<string>((subscriber) => {
      probe2++;
      console.log(`    [${new Date().toISOString().slice(17, 23)}] Próba: #${probe2}`);
      if (probe2 < 3) {
        subscriber.error(new Error("Hiba"));
      } else {
        subscriber.next("Siker!");
        subscriber.complete();
      }
    });

    instabil2$
      .pipe(
        retry({ count: 3, delay: 100 }),
        finalize(() => resolve())
      )
      .subscribe({
        next: (v) => console.log(`    Eredmény: ${v}`),
        error: (err) => console.log(`    Végleg sikertelen: ${err.message}`),
      });
  });

  // ============================================================
  // 5. finalize() - Takarítás végén (sikerre és hibára is)
  // ============================================================
  alfejlec("5. finalize() - Mindig lefut (try/finally)");

  /**
   * A finalize() MINDIG lefut:
   * - complete() esetén
   * - error() esetén
   * - unsubscribe() esetén
   *
   * Mint a try/finally blokk.
   * Hasznos: loading flag törlése, erőforrás felszabadítás.
   */

  console.log("  Sikeres eset:");
  of("adat")
    .pipe(
      tap(() => console.log("    Betöltés indul...")),
      finalize(() => console.log("    [finalize] Betöltés vége (sikeres)"))
    )
    .subscribe((v) => console.log(`    Kapott: ${v}`));

  console.log("\n  Hibás eset:");
  throwError(() => new Error("API hiba"))
    .pipe(
      tap(() => console.log("    Betöltés indul...")),
      finalize(() => console.log("    [finalize] Betöltés vége (hibás)"))
    )
    .subscribe({
      error: (err) => console.log(`    Hiba: ${err.message}`),
    });

  // ============================================================
  // 6. timeout() - Időtúllépés kezelése
  // ============================================================
  alfejlec("6. timeout() - Időtúllépés");

  /**
   * A timeout() hibát dob, ha az Observable nem bocsát ki
   * értéket a megadott időn belül.
   *
   * Tipikus felhasználás: API timeout implementáció.
   */

  console.log("  Lassú API hívás timeout-tal:");
  await new Promise<void>((resolve) => {
    const lassuApi$ = of("Lassú válasz").pipe(delay(500));

    lassuApi$
      .pipe(
        timeout(200), // 200ms timeout
        catchError((err) => {
          return of("Timeout! Alapértelmezett adat használata.");
        }),
        finalize(() => resolve())
      )
      .subscribe((v) => console.log(`    ${v}`));
  });

  // ============================================================
  // 7. Gyakorlati példa: Robusztus API hívás minta
  // ============================================================
  alfejlec("7. Gyakorlati példa: Robusztus API hívás");

  /**
   * Egy valós alkalmazásban az API hívásokat így kezeljük:
   * 1. Loading jelzés bekapcsolása
   * 2. API hívás timeout-tal
   * 3. Hiba esetén retry (max N alkalommal)
   * 4. Ha a retry is sikertelen, catchError
   * 5. finalize: loading jelzés kikapcsolása
   */

  let betoltes = false;
  let apiProba = 0;

  function szimulaltApiHivas(): Observable<{ adat: string }> {
    return new Observable((subscriber) => {
      apiProba++;
      const sikeresLesz = apiProba >= 2; // 2. próbára sikerül
      const kesleltetes = sikeresLesz ? 50 : 80;

      setTimeout(() => {
        if (sikeresLesz) {
          subscriber.next({ adat: "Felhasználói profil adatok" });
          subscriber.complete();
        } else {
          subscriber.error(new Error("500 Internal Server Error"));
        }
      }, kesleltetes);
    });
  }

  apiProba = 0;
  await new Promise<void>((resolve) => {
    of(null)
      .pipe(
        tap(() => {
          betoltes = true;
          console.log("    [1] Betöltés indítása...");
        }),
        switchMap(() =>
          szimulaltApiHivas().pipe(
            timeout(200),
            retry({ count: 2, delay: 100 }),
            catchError((err) => {
              console.log(`    [!] Végleg sikertelen: ${err.message}`);
              return of({ adat: "Nincs elérhető adat (offline mód)" });
            })
          )
        ),
        finalize(() => {
          betoltes = false;
          console.log("    [4] Betöltés befejezve (loading: false)");
          resolve();
        })
      )
      .subscribe((eredmeny) => {
        console.log(`    [3] Kapott adat: "${eredmeny.adat}"`);
      });
  });

  console.log("\n\n>>> A 07-hibakezeles.ts bemutatója befejeződött! <<<");
}

main();
