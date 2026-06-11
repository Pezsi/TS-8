/**
 * ============================================================
 *  03 - ÁTALAKÍTÓ OPERÁTOROK (Transformation Operators)
 * ============================================================
 *
 *  Az átalakító operátorok az Observable-ből érkező értékeket
 *  módosítják, kombinálják, vagy más Observable-lé alakítják.
 *
 *  A pipe() metóduson keresztül láncolhatjuk az operátorokat.
 *  Ez olyan, mint egy futószalag: az adat áthalad minden
 *  operátoron és közben átalakul.
 */

import { of, from, interval, Observable } from "rxjs";
import {
  map,
  filter,
  tap,
  switchMap,
  mergeMap,
  concatMap,
  exhaustMap,
  scan,
  reduce,
  toArray,
  take,
  delay,
  finalize,
  bufferCount,
  groupBy,
  mergeAll,
  pairwise,
  pluck,
} from "rxjs/operators";
import { fejlec, alfejlec, varakozas } from "./utils";

async function main() {
  // ============================================================
  // 1. map() - Értékek átalakítása
  // ============================================================
  fejlec("1. map() - Értékek átalakítása");

  /**
   * A map() minden kibocsátott értéket átalakít a megadott függvénnyel.
   * Pontosan úgy működik, mint az Array.map(), csak Observable-re.
   *
   * Bejövő:  --1----2----3----4-->
   * map(x => x * 10)
   * Kimenő:  --10---20---30---40->
   */

  of(1, 2, 3, 4, 5)
    .pipe(map((szam) => szam * 10))
    .subscribe((v) => console.log(`  ${v}`));

  // Objektumok átalakítása
  alfejlec("1b. map() - Objektumok átalakítása");

  interface Felhasznalo {
    nev: string;
    kor: number;
  }

  const felhasznalok: Felhasznalo[] = [
    { nev: "Anna", kor: 28 },
    { nev: "Béla", kor: 35 },
    { nev: "Csilla", kor: 22 },
  ];

  from(felhasznalok)
    .pipe(
      map((f) => `${f.nev} (${f.kor} éves)`),
      map((s) => s.toUpperCase())
    )
    .subscribe((v) => console.log(`  ${v}`));

  // ============================================================
  // 2. tap() - Mellékhatás (Side effect)
  // ============================================================
  alfejlec("2. tap() - Mellékhatás (debug, logolás)");

  /**
   * A tap() NEM módosítja az értékeket, csak "belekukucskál"
   * a stream-be. Ideális debug-olásra vagy mellékhatásokra.
   *
   * Bejövő:  --1----2----3-->
   * tap(x => console.log(x))
   * Kimenő:  --1----2----3-->  (változatlan!)
   */

  of(1, 2, 3)
    .pipe(
      tap((v) => console.log(`    [tap ELŐTTE] érték: ${v}`)),
      map((v) => v * 100),
      tap((v) => console.log(`    [tap UTÁNA] érték: ${v}`))
    )
    .subscribe((v) => console.log(`  Végeredmény: ${v}`));

  // ============================================================
  // 3. scan() - Futó összesítés (mint Array.reduce, de közbenső értékekkel)
  // ============================================================
  alfejlec("3. scan() - Futó összesítés");

  /**
   * A scan() minden bejövő értéknél kiszámolja az eddigi
   * akkumulált értéket ÉS ki is bocsátja.
   *
   * Bejövő:  --1----2----3----4-->
   * scan((acc, x) => acc + x, 0)
   * Kimenő:  --1----3----6----10->
   *
   * (1, 1+2=3, 3+3=6, 6+4=10)
   */

  console.log("  Futó összeg:");
  of(1, 2, 3, 4, 5)
    .pipe(scan((osszeg, ertek) => osszeg + ertek, 0))
    .subscribe((v) => console.log(`    Összeg eddig: ${v}`));

  // Gyakorlati példa: bevásárlólista futó összege
  console.log("\n  Bevásárlólista:");
  interface Termek {
    nev: string;
    ar: number;
  }

  const kosar: Termek[] = [
    { nev: "Kenyér", ar: 500 },
    { nev: "Tej", ar: 350 },
    { nev: "Sajt", ar: 1200 },
    { nev: "Alma", ar: 800 },
  ];

  from(kosar)
    .pipe(
      scan(
        (acc, termek) => ({
          tetelek: [...acc.tetelek, termek.nev],
          osszeg: acc.osszeg + termek.ar,
        }),
        { tetelek: [] as string[], osszeg: 0 }
      )
    )
    .subscribe((v) =>
      console.log(
        `    [${v.tetelek.join(", ")}] → összesen: ${v.osszeg} Ft`
      )
    );

  // ============================================================
  // 4. reduce() - Végső összesítés (csak az utolsó értéket adja)
  // ============================================================
  alfejlec("4. reduce() - Végső összesítés");

  /**
   * A reduce() ugyanúgy működik, mint a scan(), DE
   * csak a VÉGSŐ eredményt bocsátja ki (a complete() után).
   *
   * Bejövő:  --1----2----3----4--|
   * reduce((acc, x) => acc + x, 0)
   * Kimenő:  --------------------10|
   */

  of(1, 2, 3, 4, 5)
    .pipe(reduce((osszeg, ertek) => osszeg + ertek, 0))
    .subscribe((v) => console.log(`  Végső összeg: ${v}`));

  // ============================================================
  // 5. toArray() - Stream összegyűjtése tömbbe
  // ============================================================
  alfejlec("5. toArray() - Értékek összegyűjtése tömbbe");

  of(3, 1, 4, 1, 5, 9)
    .pipe(
      filter((x) => x > 2),
      toArray()
    )
    .subscribe((tomb) => console.log(`  Szűrt tömb: [${tomb}]`));

  // ============================================================
  // 6. switchMap() - A LEGFONTOSABB átalakító operátor
  // ============================================================
  alfejlec("6. switchMap() - Belső Observable-re váltás");

  /**
   * A switchMap() minden bejövő értékből egy ÚJ Observable-t hoz létre,
   * és LEMOND az előzőről (unsubscribe).
   *
   * Tipikus felhasználás: keresőmező!
   * Ha a felhasználó új betűt ír, az előző keresési kérést
   * eldobjuk és az újjal foglalkozunk.
   *
   * Bejövő:  --A-------B-------C-->
   * switchMap(x => http.get(x))
   *            \---a1   \---b1  \---c1
   *                      ↑ A korábbi stream-et törli!
   * Kimenő:  ------a1------b1------c1->
   */

  // Szimulált API hívás
  function kereses(kifejezes: string): Observable<string> {
    return of(`Eredmény: "${kifejezes}"`).pipe(delay(100));
  }

  console.log("  switchMap - keresés szimuláció:");
  from(["Rx", "RxJ", "RxJS"]) // Gyorsan gépelt betűk
    .pipe(
      tap((k) => console.log(`    Keresés indítva: "${k}"`)),
      switchMap((kifejezes) => kereses(kifejezes))
    )
    .subscribe((eredmeny) => console.log(`    ${eredmeny}`));

  await varakozas(500);

  // ============================================================
  // 7. mergeMap() - Párhuzamos belső Observable-ök
  // ============================================================
  alfejlec("7. mergeMap() - Párhuzamos feldolgozás");

  /**
   * A mergeMap() minden bejövő értékből ÚJ Observable-t indít,
   * de NEM mondja le az előzőeket. Mindet párhuzamosan futtatja.
   *
   * Tipikus felhasználás: több párhuzamos API hívás, ahol
   * nem számít a sorrend.
   *
   * Bejövő:  --A-------B-------C-->
   * mergeMap(x => http.get(x))
   *            \---a1   \---b1  \---c1
   * Kimenő:  ------a1------b1------c1->  (mind lefut!)
   */

  function adatLetoltes(id: number): Observable<string> {
    const kesleltetes = Math.random() * 200 + 50;
    return of(`Adat #${id} (${Math.round(kesleltetes)}ms)`).pipe(
      delay(kesleltetes)
    );
  }

  console.log("  mergeMap - párhuzamos letöltések:");
  await new Promise<void>((resolve) => {
    from([1, 2, 3, 4, 5])
      .pipe(
        mergeMap((id) => adatLetoltes(id)),
        finalize(() => resolve())
      )
      .subscribe((v) => console.log(`    ${v}`));
  });

  // ============================================================
  // 8. concatMap() - Szekvenciális belső Observable-ök
  // ============================================================
  alfejlec("8. concatMap() - Sorrendben, egymás után");

  /**
   * A concatMap() minden belső Observable-t megvár, mielőtt
   * a következőt elindítaná. A sorrend GARANTÁLT.
   *
   * Tipikus felhasználás: ha a műveletek sorrendje fontos
   * (pl. fájl mentés, szekvenciális API hívások).
   *
   * Bejövő:  --A-------B-------C-->
   * concatMap(x => http.get(x))
   *            \---a1|
   *                    \---b1|
   *                            \---c1|
   * Kimenő:  ------a1------b1------c1|
   */

  console.log("  concatMap - szekvenciális feldolgozás:");
  await new Promise<void>((resolve) => {
    from(["Első", "Második", "Harmadik"])
      .pipe(
        concatMap((nev, index) =>
          of(`${nev} feladat kész`).pipe(delay((3 - index) * 100))
        ),
        finalize(() => resolve())
      )
      .subscribe((v) => console.log(`    ${v}`));
  });

  // ============================================================
  // 9. exhaustMap() - Figyelmen kívül hagyja az újat, amíg fut a régi
  // ============================================================
  alfejlec("9. exhaustMap() - Várakozás a befejezésre");

  /**
   * Az exhaustMap() figyelmen kívül hagy minden új értéket,
   * amíg az aktuális belső Observable fut.
   *
   * Tipikus felhasználás: dupla kattintás megelőzése!
   * Ha a felhasználó többször kattint a "Mentés" gombra,
   * csak az első kattintás indít mentést.
   *
   * Bejövő:  --A--B--C--------D-->
   * exhaustMap(x => ---x1|)
   *            \---a1|          \---d1|
   *               B és C figyelmen kívül hagyva!
   * Kimenő:  ------a1--------------d1|
   */

  console.log("  exhaustMap - 'dupla kattintás' megelőzés:");
  await new Promise<void>((resolve) => {
    // Szimuláljuk: 5 gyors kattintás (50ms-ként), de a mentés 200ms
    interval(50)
      .pipe(
        take(5),
        tap((i) => console.log(`    Kattintás: ${i}`)),
        exhaustMap((i) =>
          of(`Mentés #${i} kész!`).pipe(delay(200))
        ),
        finalize(() => resolve())
      )
      .subscribe((v) => console.log(`    >>> ${v}`));
  });

  // ============================================================
  // 10. ÖSSZEHASONLÍTÁS: switchMap vs mergeMap vs concatMap vs exhaustMap
  // ============================================================
  alfejlec("10. Összehasonlítás - Melyiket mikor?");

  console.log(`
  ┌─────────────┬──────────────────────────┬─────────────────────┐
  │ Operátor    │ Viselkedés               │ Tipikus használat   │
  ├─────────────┼──────────────────────────┼─────────────────────┤
  │ switchMap   │ Lemondja az előzőt       │ Keresőmező,         │
  │             │                          │ route váltás        │
  ├─────────────┼──────────────────────────┼─────────────────────┤
  │ mergeMap    │ Mindet párhuzamosan      │ Párhuzamos API      │
  │             │ futtatja                 │ hívások             │
  ├─────────────┼──────────────────────────┼─────────────────────┤
  │ concatMap   │ Sorban, egymás után      │ Szekvenciális       │
  │             │                          │ műveletek           │
  ├─────────────┼──────────────────────────┼─────────────────────┤
  │ exhaustMap  │ Figyelmen kívül hagyja   │ Gomb kattintás,     │
  │             │ az újat amíg fut a régi  │ form submit         │
  └─────────────┴──────────────────────────┴─────────────────────┘`);

  // ============================================================
  // 11. pairwise() - Párosítás az előző értékkel
  // ============================================================
  alfejlec("11. pairwise() - Előző és aktuális érték együtt");

  /**
   * A pairwise() minden kibocsátott értéket az előzővel párosítja.
   * Hasznos változáskövetéshez (pl. "mennyit változott?").
   */

  of(10, 20, 15, 30, 25)
    .pipe(
      pairwise(),
      map(([elozo, aktualis]) => ({
        elozo,
        aktualis,
        valtozas: aktualis - elozo,
      }))
    )
    .subscribe((v) =>
      console.log(
        `  ${v.elozo} → ${v.aktualis} (változás: ${v.valtozas > 0 ? "+" : ""}${v.valtozas})`
      )
    );

  // ============================================================
  // 12. bufferCount() - Értékek csoportosítása
  // ============================================================
  alfejlec("12. bufferCount() - Csoportosítás darabszám alapján");

  /**
   * A bufferCount(n) összegyűjt n darab értéket egy tömbbe,
   * majd kibocsátja a tömböt.
   */

  of(1, 2, 3, 4, 5, 6, 7, 8, 9)
    .pipe(bufferCount(3))
    .subscribe((csoport) => console.log(`  Csoport: [${csoport}]`));

  console.log("\n\n>>> A 03-atalakito-operatorok.ts bemutatója befejeződött! <<<");
}

main();
