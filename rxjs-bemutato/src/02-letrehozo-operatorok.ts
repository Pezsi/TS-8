/**
 * ============================================================
 *  02 - LÉTREHOZÓ OPERÁTOROK (Creation Operators)
 * ============================================================
 *
 *  Ezek az operátorok új Observable-öket hoznak létre.
 *  Nem kell mindig kézzel new Observable()-t írni -
 *  ezek a gyári "shortcut"-ok a leggyakoribb esetekre.
 */

import { of, from, interval, timer, range, defer, EMPTY, NEVER, throwError, generate } from "rxjs";
import { take, map, finalize } from "rxjs/operators";
import { fejlec, alfejlec, varakozas } from "./utils";

async function main() {
  // ============================================================
  // 1. of() - Megadott értékekből hoz létre Observable-t
  // ============================================================
  fejlec("1. of() - Értékek felsorolása");

  /**
   * Az of() a megadott értékeket egymás után kibocsátja, majd befejezi a stream-et.
   * Szinkron működésű - azonnal kiadja az összes értéket.
   *
   * Használat: amikor fix értékekből kell Observable-t csinálni,
   * pl. teszteléshez, default értékhez, vagy egyszerű adatforrásként.
   */
  of("alma", "körte", "szilva").subscribe({
    next: (gyumolcs) => console.log(`  Gyümölcs: ${gyumolcs}`),
    complete: () => console.log("  ✓ Kész"),
  });

  // Különböző típusú értékekkel is működik
  of(42, "szöveg", true, [1, 2, 3]).subscribe((v) =>
    console.log(`  Érték: ${v} (típus: ${typeof v})`)
  );

  // ============================================================
  // 2. from() - Iterálhatóból/Promise-ból hoz létre Observable-t
  // ============================================================
  alfejlec("2. from() - Tömb, string, Promise, stb.");

  /**
   * A from() átalakít szinte bármit Observable-lé:
   * - Tömb → minden elem külön next() hívás lesz
   * - String → minden karakter külön next() hívás lesz
   * - Promise → az eredmény egyetlen next() + complete()
   * - Iterable (pl. Set, Map) → elemek kibocsátása
   */

  // Tömbből
  console.log("  Tömbből:");
  from([10, 20, 30, 40, 50]).subscribe((sz) => console.log(`    ${sz}`));

  // Stringből - karakterenként
  console.log("  Stringből (karakterenként):");
  from("RxJS").subscribe((karakter) => console.log(`    '${karakter}'`));

  // Set-ből (egyedi értékek)
  console.log("  Set-ből:");
  from(new Set([1, 2, 2, 3, 3, 3])).subscribe((sz) =>
    console.log(`    ${sz}`)
  );

  // Promise-ból
  console.log("  Promise-ból:");
  from(Promise.resolve("Aszinkron adat megérkezett!")).subscribe((v) =>
    console.log(`    ${v}`)
  );

  await varakozas(100);

  // ============================================================
  // 3. interval() - Időzített számláló
  // ============================================================
  alfejlec("3. interval() - Időzített értékek");

  /**
   * Az interval(ms) minden `ms` milliszekundumonként kibocsát
   * egy növekvő számot (0, 1, 2, 3...).
   *
   * FONTOS: Ez egy VÉGTELEN stream! Mindig le kell iratkozni,
   * vagy take()/takeUntil()-lal korlátozni.
   */

  console.log("  interval(200) az első 5 érték:");
  await new Promise<void>((resolve) => {
    interval(200)
      .pipe(
        take(5), // Csak az első 5 értéket vesszük
        finalize(() => resolve())
      )
      .subscribe((i) => console.log(`    Tick: ${i}`));
  });

  // ============================================================
  // 4. timer() - Késleltetett vagy egyszeri kibocsátás
  // ============================================================
  alfejlec("4. timer() - Késleltetett indulás");

  /**
   * timer(késleltetés) - egyetlen értéket bocsát ki a késleltetés után
   * timer(késleltetés, periódus) - mint az interval, de késleltetett indulással
   */

  // Egyszeri kibocsátás 300ms késleltetéssel
  console.log("  timer(300) - 300ms késleltetés után:");
  await new Promise<void>((resolve) => {
    timer(300)
      .pipe(finalize(() => resolve()))
      .subscribe((v) => console.log(`    Kibocsátva: ${v}`));
  });

  // Késleltetett interval: 200ms várakozás, utána 100ms-ként
  console.log("  timer(200, 100) - késleltetett interval:");
  await new Promise<void>((resolve) => {
    timer(200, 100)
      .pipe(
        take(4),
        finalize(() => resolve())
      )
      .subscribe((v) => console.log(`    Tick: ${v}`));
  });

  // ============================================================
  // 5. range() - Számsorozat generálása
  // ============================================================
  alfejlec("5. range() - Számsorozat");

  /**
   * range(start, count) - `count` darab egymás utáni egész számot bocsát ki
   * `start`-tól indulva.
   */

  console.log("  range(1, 5) → 1-től 5 darab szám:");
  range(1, 5).subscribe((sz) => console.log(`    ${sz}`));

  console.log("  range(10, 3) → 10-től 3 darab szám:");
  range(10, 3).subscribe((sz) => console.log(`    ${sz}`));

  // ============================================================
  // 6. generate() - Ciklusszerű Observable
  // ============================================================
  alfejlec("6. generate() - for ciklus Observable-ként");

  /**
   * generate() hasonlít egy for ciklushoz:
   * - initialState: kezdőérték
   * - condition: meddig menjen (while feltétel)
   * - iterate: hogyan változzon az állapot (i++ szerűen)
   * - resultSelector: mit bocsásson ki
   */

  generate({
    initialState: 0,
    condition: (x: number) => x < 5,
    iterate: (x: number) => x + 1,
    resultSelector: (x: number) => x * x, // négyzetszámok
  }).subscribe((v) => console.log(`    ${v}`));

  // ============================================================
  // 7. defer() - Lusta Observable létrehozás
  // ============================================================
  alfejlec("7. defer() - Lusta létrehozás");

  /**
   * A defer() NEM hoz létre Observable-t a definiáláskor.
   * Minden feliratkozáskor ÚJRA meghívja a factory függvényt.
   *
   * Ez hasznos, ha az Observable-nek friss adatokra van szüksége
   * minden feliratkozáskor (pl. aktuális idő, random szám).
   */

  // defer nélkül: az idő a LÉTREHOZÁSKOR rögzül
  const idoNelkul$ = of(new Date().toISOString());

  // defer-rel: az idő FELIRATKOZÁSKOR frissül
  const idoDefer$ = defer(() => of(new Date().toISOString()));

  console.log("  Normál of() - mindig ugyanaz:");
  idoNelkul$.subscribe((v) => console.log(`    1. feliratkozás: ${v}`));
  await varakozas(100);
  idoNelkul$.subscribe((v) => console.log(`    2. feliratkozás: ${v}`));

  await varakozas(100);

  console.log("\n  defer() - mindig friss:");
  idoDefer$.subscribe((v) => console.log(`    1. feliratkozás: ${v}`));
  await varakozas(100);
  idoDefer$.subscribe((v) => console.log(`    2. feliratkozás: ${v}`));

  // ============================================================
  // 8. EMPTY, NEVER, throwError - Speciális Observable-ök
  // ============================================================
  alfejlec("8. Speciális Observable-ök: EMPTY, NEVER, throwError");

  /**
   * EMPTY      - azonnal complete()-et küld, nincs next()
   * NEVER      - soha nem csinál semmit (nem küld next-et, error-t, complete-et)
   * throwError - azonnal error-t dob
   *
   * Ezek elsősorban operátorokon belül hasznosak
   * (pl. catchError-ban EMPTY-t visszaadni = "hagyd figyelmen kívül a hibát").
   */

  console.log("  EMPTY:");
  EMPTY.subscribe({
    next: (v) => console.log(`    next: ${v}`), // Ez NEM fut le
    complete: () => console.log("    ✓ Azonnal befejeződött (nincs érték)"),
  });

  console.log("  throwError:");
  throwError(() => new Error("Szándékos hiba!")).subscribe({
    next: (v) => console.log(`    next: ${v}`), // Ez NEM fut le
    error: (err) => console.log(`    ✗ Hiba: ${err.message}`),
  });

  console.log("\n\n>>> A 02-letrehozo-operatorok.ts bemutatója befejeződött! <<<");
}

main();
