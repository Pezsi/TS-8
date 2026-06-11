/**
 * ============================================================
 *  01 - RxJS ALAPOK
 * ============================================================
 *
 *  Mi az RxJS?
 *  -----------
 *  Az RxJS (Reactive Extensions for JavaScript) egy könyvtár,
 *  amely az aszinkron és esemény-alapú programozást teszi
 *  egyszerűbbé az Observable minta segítségével.
 *
 *  Három alapfogalom:
 *  1. Observable  - adatfolyam (stream), amely értékeket bocsát ki
 *  2. Observer    - megfigyelő, aki "feliratkozik" az adatfolyamra
 *  3. Subscription - a feliratkozás maga, amelyet le is lehet iratkozni
 *
 *  Gondolj rá úgy, mint egy YouTube csatornára:
 *  - Observable  = a csatorna (tartalom forrása)
 *  - Observer    = a feliratkozó (néző)
 *  - Subscription = a feliratkozás (amit bármikor törölhetsz)
 */

import { Observable, of, from, Subscription } from "rxjs";
import { fejlec, alfejlec } from "./utils";

// ============================================================
// 1. PÉLDA: Saját Observable létrehozása kézzel
// ============================================================
fejlec("1. PÉLDA: Saját Observable létrehozása");

/**
 * Az Observable konstruktorral mi magunk definiáljuk,
 * hogy milyen értékeket bocsát ki az adatfolyam.
 *
 * A subscriber objektumnak 3 metódusa van:
 * - next(érték)   → következő érték kibocsátása
 * - error(hiba)   → hiba jelzése (leállítja a stream-et)
 * - complete()    → befejezés jelzése (leállítja a stream-et)
 */
const sajatObservable = new Observable<string>((subscriber) => {
  // Értékek kibocsátása egymás után
  subscriber.next("Első érték");
  subscriber.next("Második érték");
  subscriber.next("Harmadik érték");

  // A stream befejezése - ezután nem jön több érték
  subscriber.complete();

  // Ez már NEM fog lefutni, mert a complete() után vége a stream-nek
  subscriber.next("Ez már nem jelenik meg");
});

// Feliratkozás (subscribe) - itt indul el az adatfolyam
sajatObservable.subscribe({
  next: (ertek) => console.log(`  Kapott érték: ${ertek}`),
  error: (hiba) => console.log(`  Hiba történt: ${hiba}`),
  complete: () => console.log("  ✓ Az adatfolyam befejeződött!"),
});

// ============================================================
// 2. PÉLDA: Observer rövidített formái
// ============================================================
alfejlec("2. PÉLDA: Observer rövidített formái");

/**
 * Nem kötelező mindhárom callback-et megadni.
 * Ha csak a next érdekel, elég egy függvényt átadni.
 */

const szamok$ = of(1, 2, 3); // az of() segítségével gyorsan létrehozhatunk Observable-t

// Teljes observer objektum
szamok$.subscribe({
  next: (sz) => console.log(`  Szám: ${sz}`),
  complete: () => console.log("  ✓ Kész"),
});

// Rövidített forma: csak a next callback
console.log("\n  Rövidített forma:");
szamok$.subscribe((sz) => console.log(`  Szám: ${sz}`));

// ============================================================
// 3. PÉLDA: Subscription és leiratkozás
// ============================================================
alfejlec("3. PÉLDA: Subscription és leiratkozás");

/**
 * A subscribe() visszaad egy Subscription objektumot.
 * Az unsubscribe() metódussal bármikor leiratkozhatunk.
 *
 * Ez fontos a MEMÓRIASZIVÁRGÁS elkerülése érdekében!
 * Ha egy Observable végtelen stream-et bocsát ki
 * (pl. interval, websocket), és nem iratkozunk le,
 * az a memóriában marad és fut tovább.
 */

let szamlalo = 0;

const vegtelenStream = new Observable<number>((subscriber) => {
  const id = setInterval(() => {
    szamlalo++;
    subscriber.next(szamlalo);
  }, 100);

  // Teardown logika: ez fut le leiratkozáskor
  return () => {
    clearInterval(id);
    console.log("  ✓ Leiratkozás megtörtént, interval leállítva!");
  };
});

const feliratkozas: Subscription = vegtelenStream.subscribe((ertek) => {
  console.log(`  Végtelen stream értéke: ${ertek}`);
});

// 500ms után leiratkozunk → az interval leáll
setTimeout(() => {
  feliratkozas.unsubscribe();
}, 500);

// ============================================================
// 4. PÉLDA: Cold vs Hot Observable
// ============================================================
setTimeout(() => {
  alfejlec("4. PÉLDA: Cold Observable (hideg)");

  /**
   * COLD Observable:
   * - Minden feliratkozónak SAJÁT, független adatfolyamot indít
   * - Olyan, mint egy YouTube videó: mindenki az elejétől nézi
   *
   * HOT Observable:
   * - Egy közös adatfolyamot oszt meg az összes feliratkozóval
   * - Olyan, mint egy élő közvetítés: aki később csatlakozik,
   *   lemarad a korábbi eseményekről
   * (Hot Observable-ökkel a 06-subjects.ts-ben foglalkozunk)
   */

  // Ez egy COLD Observable - minden feliratkozó az elejétől kapja
  const cold$ = new Observable<number>((subscriber) => {
    console.log("  >> Új adatfolyam indult!");
    subscriber.next(Math.random()); // minden feliratkozó MÁS random számot kap
    subscriber.complete();
  });

  console.log("  1. feliratkozó:");
  cold$.subscribe((v) => console.log(`    Érték: ${v}`));

  console.log("  2. feliratkozó:");
  cold$.subscribe((v) => console.log(`    Érték: ${v}`));
  // Figyeld meg: mindkét feliratkozó más random számot kap!
  // Ez bizonyítja, hogy a Cold Observable minden feliratkozónak
  // külön-külön futtatja a logikát.

  // ============================================================
  // 5. PÉLDA: Observable vs Promise összehasonlítás
  // ============================================================
  alfejlec("5. PÉLDA: Observable vs Promise");

  /**
   * Observable vs Promise - mikor melyiket használjuk?
   *
   * | Szempont          | Promise              | Observable            |
   * |-------------------|----------------------|-----------------------|
   * | Értékek száma     | Pontosan 1           | 0, 1 vagy végtelen   |
   * | Lusta (lazy)?     | Nem (azonnal indul)  | Igen (subscribe-kor) |
   * | Lemondható?       | Nem                  | Igen (unsubscribe)   |
   * | Operátorok        | .then(), .catch()    | pipe() + 100+ op.    |
   * | Többszöri felir.  | Nem                  | Igen                 |
   */

  // Promise: AZONNAL elindul, akkor is ha senki nem használja
  const promise = new Promise<string>((resolve) => {
    console.log("  Promise: AZONNAL lefutok!");
    resolve("Promise eredmény");
  });

  // Observable: LUSTA, csak subscribe-kor indul el
  const observable = new Observable<string>((subscriber) => {
    console.log("  Observable: Csak subscribe-kor futok!");
    subscriber.next("Observable eredmény");
    subscriber.complete();
  });

  console.log("  (Figyeld meg: a Promise már lefutott, az Observable még nem!)");
  console.log("  Most feliratkozunk az Observable-re:");
  observable.subscribe((v) => console.log(`  Kapott: ${v}`));

  // Observable-t lehet Promise-ból is létrehozni
  alfejlec("5b. Promise átalakítása Observable-lé");
  const promisebol$ = from(Promise.resolve("Promise-ból jött adat"));
  promisebol$.subscribe((v) => console.log(`  ${v}`));

  console.log("\n\n>>> A 01-alapok.ts bemutatója befejeződött! <<<");
}, 700);
