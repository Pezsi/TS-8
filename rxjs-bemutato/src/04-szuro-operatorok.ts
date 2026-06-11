/**
 * ============================================================
 *  04 - SZŰRŐ OPERÁTOROK (Filtering Operators)
 * ============================================================
 *
 *  A szűrő operátorok meghatározzák, MELY értékeket engedjük
 *  tovább a stream-ben. Az összes többi értéket "eldobják".
 */

import { of, from, interval, Subject, timer } from "rxjs";
import {
  filter,
  take,
  takeUntil,
  takeWhile,
  skip,
  skipWhile,
  first,
  last,
  distinct,
  distinctUntilChanged,
  debounceTime,
  throttleTime,
  auditTime,
  sampleTime,
  finalize,
  elementAt,
} from "rxjs/operators";
import { fejlec, alfejlec, varakozas } from "./utils";

async function main() {
  // ============================================================
  // 1. filter() - Feltétel alapú szűrés
  // ============================================================
  fejlec("1. filter() - Feltétel alapú szűrés");

  /**
   * Pontosan úgy működik, mint az Array.filter().
   * Csak azokat az értékeket engedi tovább, amelyekre
   * a predikátum (feltétel) igazat ad.
   *
   * Bejövő:  --1--2--3--4--5--6-->
   * filter(x => x % 2 === 0)
   * Kimenő:  -----2-----4-----6-->
   */

  of(1, 2, 3, 4, 5, 6, 7, 8, 9, 10)
    .pipe(filter((szam) => szam % 2 === 0))
    .subscribe((v) => console.log(`  Páros: ${v}`));

  // Összetettebb szűrés objektumokon
  alfejlec("1b. filter() - Objektumok szűrése");

  interface Diak {
    nev: string;
    atlag: number;
    aktiv: boolean;
  }

  const diakok: Diak[] = [
    { nev: "Anna", atlag: 4.5, aktiv: true },
    { nev: "Béla", atlag: 3.2, aktiv: false },
    { nev: "Csilla", atlag: 4.8, aktiv: true },
    { nev: "Dávid", atlag: 2.9, aktiv: true },
    { nev: "Eszter", atlag: 5.0, aktiv: true },
  ];

  console.log("  Aktív diákok 4.0 feletti átlaggal:");
  from(diakok)
    .pipe(filter((d) => d.aktiv && d.atlag >= 4.0))
    .subscribe((d) => console.log(`    ${d.nev} - átlag: ${d.atlag}`));

  // ============================================================
  // 2. take() és skip() - Darabszám alapú szűrés
  // ============================================================
  alfejlec("2. take() és skip()");

  /**
   * take(n)  - az első n értéket veszi, utána complete()
   * skip(n)  - az első n értéket kihagyja
   *
   * take:  --1--2--3--4--5-->  →  take(3)  →  --1--2--3|
   * skip:  --1--2--3--4--5-->  →  skip(2)  →  --------3--4--5-->
   */

  console.log("  take(3) - első 3 elem:");
  of(10, 20, 30, 40, 50)
    .pipe(take(3))
    .subscribe((v) => console.log(`    ${v}`));

  console.log("  skip(2) - első 2 kihagyása:");
  of(10, 20, 30, 40, 50)
    .pipe(skip(2))
    .subscribe((v) => console.log(`    ${v}`));

  // ============================================================
  // 3. takeWhile() és skipWhile() - Feltétel alapú korlátozás
  // ============================================================
  alfejlec("3. takeWhile() és skipWhile()");

  /**
   * takeWhile(feltétel) - addig veszi az értékeket, amíg a feltétel igaz
   *                       Az ELSŐ hamis értéknél megáll (complete)
   *
   * skipWhile(feltétel) - addig hagyja ki az értékeket, amíg a feltétel igaz
   *                       Az ELSŐ hamis értéktől kezdve mindent átenged
   */

  console.log("  takeWhile(x < 40) - 40-ig veszi:");
  of(10, 20, 30, 40, 50, 10, 20)
    .pipe(takeWhile((x) => x < 40))
    .subscribe((v) => console.log(`    ${v}`));
  // Megjegyzés: a 40 utáni 10 és 20 sem jön, mert a stream leállt!

  console.log("  skipWhile(x < 30) - 30-tól engedi:");
  of(10, 20, 30, 40, 10, 50)
    .pipe(skipWhile((x) => x < 30))
    .subscribe((v) => console.log(`    ${v}`));
  // Megjegyzés: a 10 is átjön a végén, mert a skip feltétel már letelt!

  // ============================================================
  // 4. takeUntil() - Leállítás másik Observable jelzésére
  // ============================================================
  alfejlec("4. takeUntil() - Leállítás jelzésre");

  /**
   * A takeUntil() egy MÁSIK Observable-t kap paraméterül (notifier).
   * Amint a notifier kibocsát bármit, a forrás stream leáll.
   *
   * Ez a LEGJOBB módja a leiratkozásnak Angular-ban!
   *
   * Forrás:   --1--2--3--4--5--6-->
   * Notifier: -----------X-------->
   * Kimenő:   --1--2--3--|
   */

  console.log("  interval leállítása 350ms után:");
  await new Promise<void>((resolve) => {
    const stop$ = timer(350); // 350ms után jelez

    interval(100)
      .pipe(
        takeUntil(stop$),
        finalize(() => {
          console.log("    ✓ Leállítva!");
          resolve();
        })
      )
      .subscribe((v) => console.log(`    Tick: ${v}`));
  });

  // ============================================================
  // 5. first() és last()
  // ============================================================
  alfejlec("5. first() és last()");

  /**
   * first()          - az első értéket adja, vagy az első ami illeszkedik
   * last()           - az utolsó értéket adja (a complete() után)
   * elementAt(index) - a megadott indexű értéket adja
   */

  const szamok$ = of(5, 10, 15, 20, 25, 30);

  console.log("  first():");
  szamok$.pipe(first()).subscribe((v) => console.log(`    ${v}`));

  console.log("  first(x > 12):");
  szamok$
    .pipe(first((x) => x > 12))
    .subscribe((v) => console.log(`    ${v}`));

  console.log("  last():");
  szamok$.pipe(last()).subscribe((v) => console.log(`    ${v}`));

  console.log("  elementAt(2) (3. elem, 0-tól indexelve):");
  szamok$.pipe(elementAt(2)).subscribe((v) => console.log(`    ${v}`));

  // ============================================================
  // 6. distinct() és distinctUntilChanged()
  // ============================================================
  alfejlec("6. distinct() és distinctUntilChanged()");

  /**
   * distinct()              - eltávolítja az ÖSSZES ismétlődést
   *                           (emlékszik az összes korábbi értékre)
   *
   * distinctUntilChanged()  - csak az EGYMÁS UTÁNI ismétlődést szűri
   *                           (csak az előzővel hasonlít)
   *
   * Bejövő:                 --1--2--1--3--2--3--3-->
   * distinct():             --1--2-----3---------->
   * distinctUntilChanged(): --1--2--1--3--2--3----->
   */

  console.log("  distinct() - globális egyediség:");
  of(1, 2, 1, 3, 2, 3, 3, 4)
    .pipe(distinct())
    .subscribe((v) => console.log(`    ${v}`));

  console.log("  distinctUntilChanged() - szomszédos egyediség:");
  of(1, 2, 1, 3, 2, 3, 3, 4)
    .pipe(distinctUntilChanged())
    .subscribe((v) => console.log(`    ${v}`));

  // Objektumokkal - összehasonlító függvénnyel
  console.log("\n  distinctUntilChanged objektumokkal:");
  of(
    { nev: "Anna", kor: 25 },
    { nev: "Anna", kor: 26 }, // ugyanaz a név
    { nev: "Béla", kor: 30 }
  )
    .pipe(distinctUntilChanged((elozo, aktualis) => elozo.nev === aktualis.nev))
    .subscribe((v) => console.log(`    ${v.nev} (${v.kor})`));

  // ============================================================
  // 7. debounceTime() - Várakozás a "leállásra"
  // ============================================================
  alfejlec("7. debounceTime() - Várakozás a gépelés leállására");

  /**
   * debounceTime(ms) csak akkor engedi tovább az értéket,
   * ha `ms` idő eltelt az UTOLSÓ kibocsátás óta.
   *
   * Tipikus felhasználás: keresőmező!
   * Megvárjuk, amíg a felhasználó befejezi a gépelést.
   *
   * Bejövő:  --a--ab--abc-------abcd-->
   *           [200ms szünet nélkül]  [200ms szünet]
   * debounceTime(200)
   * Kimenő:  -------------------abc---->
   *
   * Figyelem: a debounceTime nem jól demonstrálható szinkron
   * értékekkel, mert azonnal kiadja az utolsót. Valós alkalmazásban
   * időbeli eltolódással érkeznek az értékek (billentyűleütés).
   */

  console.log("  debounceTime(150) - szimulált gépelés:");
  await new Promise<void>((resolve) => {
    const gepeles$ = new Subject<string>();

    gepeles$
      .pipe(
        debounceTime(150),
        finalize(() => resolve())
      )
      .subscribe((v) => console.log(`    Keresés indul: "${v}"`));

    // Szimulált gépelés: gyors betűk, majd szünet
    setTimeout(() => gepeles$.next("R"), 0);
    setTimeout(() => gepeles$.next("Rx"), 50);
    setTimeout(() => gepeles$.next("RxJ"), 100);
    setTimeout(() => gepeles$.next("RxJS"), 150);
    // 150ms szünet → "RxJS" továbbmegy

    setTimeout(() => gepeles$.next("RxJS t"), 400);
    setTimeout(() => gepeles$.next("RxJS tu"), 450);
    setTimeout(() => gepeles$.next("RxJS tut"), 500);
    // 150ms szünet → "RxJS tut" továbbmegy

    setTimeout(() => {
      gepeles$.complete();
    }, 750);
  });

  // ============================================================
  // 8. throttleTime() - Időablak első/utolsó értéke
  // ============================================================
  alfejlec("8. throttleTime() - Maximális gyakoriság szabályozás");

  /**
   * throttleTime(ms) az ELSŐ értéket engedi tovább egy időablakban,
   * a többit figyelmen kívül hagyja.
   *
   * Tipikus felhasználás: scroll esemény, resize, gyors kattintás.
   *
   * Bejövő:     --1--2--3--4--5--6--7--8-->
   * throttleTime(300)
   * Kimenő:     --1--------4--------7----->
   *              ↑ 300ms ↑  ↑ 300ms ↑
   */

  console.log("  throttleTime(200) - gyors értékek szűrése:");
  await new Promise<void>((resolve) => {
    const gyorsErtekek$ = new Subject<number>();

    gyorsErtekek$
      .pipe(
        throttleTime(200),
        finalize(() => resolve())
      )
      .subscribe((v) => console.log(`    Átengedve: ${v}`));

    // 10 értéket gyorsan, 50ms-ként küldünk
    for (let i = 0; i < 10; i++) {
      setTimeout(() => gyorsErtekek$.next(i), i * 50);
    }

    setTimeout(() => gyorsErtekek$.complete(), 600);
  });

  // ============================================================
  // 9. ÖSSZEHASONLÍTÁS: debounceTime vs throttleTime
  // ============================================================
  alfejlec("9. Összehasonlítás: debounce vs throttle");

  console.log(`
  ┌────────────────┬──────────────────────────────────────────┐
  │ Operátor       │ Viselkedés                               │
  ├────────────────┼──────────────────────────────────────────┤
  │ debounceTime   │ Megvárja, amíg LEÁLL az áramlás,        │
  │                │ és az UTOLSÓ értéket adja                │
  │                │ → Keresőmező, form validáció             │
  ├────────────────┼──────────────────────────────────────────┤
  │ throttleTime   │ Időszakonként az ELSŐ értéket engedi át  │
  │                │                                          │
  │                │ → Scroll, resize, kattintás limit        │
  ├────────────────┼──────────────────────────────────────────┤
  │ auditTime      │ Időszakonként az UTOLSÓ értéket engedi   │
  │                │                                          │
  │                │ → Ha a legfrissebb állapot kell           │
  ├────────────────┼──────────────────────────────────────────┤
  │ sampleTime     │ Fix időközönként mintát vesz              │
  │                │                                          │
  │                │ → Monitoring, grafikon frissítés          │
  └────────────────┴──────────────────────────────────────────┘`);

  console.log("\n\n>>> A 04-szuro-operatorok.ts bemutatója befejeződött! <<<");
}

main();
