/**
 * ============================================================
 *  05 - KOMBINÁLÓ OPERÁTOROK (Combination Operators)
 * ============================================================
 *
 *  Ezek az operátorok TÖBB Observable-t kombinálnak egybe.
 *  Mindegyik másképp kezeli az időzítést és a kibocsátást.
 */

import {
  of,
  from,
  interval,
  timer,
  combineLatest,
  merge,
  concat,
  forkJoin,
  zip,
  race,
} from "rxjs";
import {
  take,
  map,
  delay,
  withLatestFrom,
  startWith,
  finalize,
} from "rxjs/operators";
import { fejlec, alfejlec, varakozas } from "./utils";

async function main() {
  // ============================================================
  // 1. combineLatest() - Mindig a legfrissebb kombinációt adja
  // ============================================================
  fejlec("1. combineLatest() - Legfrissebb értékek kombinálása");

  /**
   * A combineLatest() akkor bocsát ki értéket, amikor
   * BÁRMELYIK forrás kibocsát, és MINDEGYIKNEK van már értéke.
   * Mindig a legfrissebb értékeket kombinálja.
   *
   * A:              --a1------a2--------a3-->
   * B:              ------b1------b2-------->
   * combineLatest([A, B])
   * Kimenő:         ------[a1,b1]-[a2,b1]--[a2,b2]-[a3,b2]->
   *
   * Tipikus felhasználás: form mezők kombinálása,
   * szűrők frissítése, dashboard adatok.
   */

  console.log("  Szűrők kombinálása:");
  await new Promise<void>((resolve) => {
    const kategoria$ = timer(0, 300).pipe(
      take(3),
      map((i) => ["Összes", "Elektronika", "Könyv"][i])
    );
    const rendezés$ = timer(100, 300).pipe(
      take(3),
      map((i) => ["Név", "Ár", "Dátum"][i])
    );

    combineLatest([kategoria$, rendezés$])
      .pipe(finalize(() => resolve()))
      .subscribe(([kat, rend]) =>
        console.log(`    Kategória: ${kat}, Rendezés: ${rend}`)
      );
  });

  // ============================================================
  // 2. merge() - Összefésülés (interleave)
  // ============================================================
  alfejlec("2. merge() - Stream-ek összefésülése");

  /**
   * A merge() az összes forrás Observable-t EGYIDEJŰLEG figyeli,
   * és továbbítja bármelyik kibocsátását - mint egy tölcsér.
   *
   * A:       --a1-----a2-----a3-->
   * B:       ----b1-----b2------>
   * merge(A, B)
   * Kimenő:  --a1-b1--a2-b2-a3-->
   *
   * Tipikus felhasználás: több eseményforrás összevonása.
   */

  console.log("  Két kattintásforrás összevonása:");
  await new Promise<void>((resolve) => {
    const gomb1$ = timer(0, 300).pipe(
      take(3),
      map((i) => `Gomb1 kattintás #${i}`)
    );
    const gomb2$ = timer(150, 300).pipe(
      take(3),
      map((i) => `Gomb2 kattintás #${i}`)
    );

    merge(gomb1$, gomb2$)
      .pipe(finalize(() => resolve()))
      .subscribe((v) => console.log(`    ${v}`));
  });

  // ============================================================
  // 3. concat() - Egymás utáni csatlakoztatás
  // ============================================================
  alfejlec("3. concat() - Egymás után fűzés");

  /**
   * A concat() az Observable-öket SORRENDBEN futtatja.
   * Az elsőt megvárja, utána indul a második, stb.
   *
   * A:       --a1--a2--|
   * B:       --b1--b2--|
   * concat(A, B)
   * Kimenő:  --a1--a2--b1--b2--|
   *
   * Tipikus felhasználás: szekvenciális műveletek,
   * "előbb ez, utána az" logika.
   */

  console.log("  Szekvenciális API hívások:");
  await new Promise<void>((resolve) => {
    const bejelentkezes$ = of("Bejelentkezés kész").pipe(delay(100));
    const profilLetoltes$ = of("Profil letöltve").pipe(delay(100));
    const beallitasok$ = of("Beállítások betöltve").pipe(delay(100));

    concat(bejelentkezes$, profilLetoltes$, beallitasok$)
      .pipe(finalize(() => resolve()))
      .subscribe((v) => console.log(`    ${v}`));
  });

  // ============================================================
  // 4. forkJoin() - Mindent megvár, végső értékeket adja
  // ============================================================
  alfejlec("4. forkJoin() - Párhuzamos várakozás, végső értékek");

  /**
   * A forkJoin() MEGVÁRJA az összes Observable BEFEJEZÉSÉT,
   * és az utolsó kibocsátott értékekből ad tömböt/objektumot.
   *
   * Mint a Promise.all() az Observable világban!
   *
   * A:       --a1--a2--|
   * B:       --b1-----b2--b3--|
   * forkJoin([A, B])
   * Kimenő:  -----------------[a2, b3]|
   *
   * FONTOS: Ha bármelyik Observable SOHA nem fejeződik be
   * (pl. interval take nélkül), a forkJoin sem fog kibocsátani!
   */

  console.log("  Párhuzamos API hívások (mint Promise.all):");
  await new Promise<void>((resolve) => {
    forkJoin({
      felhasznalo: of({ nev: "Anna", kor: 28 }).pipe(delay(200)),
      bejegyzesek: of(["Post 1", "Post 2", "Post 3"]).pipe(delay(300)),
      beallitasok: of({ tema: "sötét", nyelv: "hu" }).pipe(delay(150)),
    })
      .pipe(finalize(() => resolve()))
      .subscribe((eredmeny) => {
        console.log(`    Felhasználó: ${eredmeny.felhasznalo.nev}`);
        console.log(`    Bejegyzések: ${eredmeny.bejegyzesek.length} db`);
        console.log(`    Téma: ${eredmeny.beallitasok.tema}`);
      });
  });

  // ============================================================
  // 5. zip() - Páronkénti összekapcsolás
  // ============================================================
  alfejlec("5. zip() - Páronkénti kombinálás");

  /**
   * A zip() az Observable-ök értékeit PÁRONKÉNT kombinálja.
   * Megvárja, amíg mindegyik forrásnak van értéke az adott indexen.
   *
   * A:       --a1-----a2-----a3-->
   * B:       ----b1--------b2---->
   * zip(A, B)
   * Kimenő:  ----[a1,b1]---[a2,b2]->
   *
   * Fontos különbség a combineLatest-tól:
   * - combineLatest: mindig a LEGFRISSEBB értékeket kombinálja
   * - zip: az AZONOS INDEXŰ értékeket párosítja
   */

  console.log("  Nevek és városok párosítása:");
  const nevek$ = of("Anna", "Béla", "Csilla");
  const varosok$ = of("Budapest", "Debrecen", "Szeged");
  const korok$ = of(28, 35, 22);

  zip(nevek$, varosok$, korok$).subscribe(([nev, varos, kor]) =>
    console.log(`    ${nev} - ${varos} (${kor} éves)`)
  );

  // ============================================================
  // 6. race() - Aki először kibocsát, az nyer
  // ============================================================
  alfejlec("6. race() - Az első forrás nyer");

  /**
   * A race() az első Observable-t használja, amelyik kibocsát.
   * A többit leállítja (unsubscribe).
   *
   * Tipikus felhasználás: timeout implementáció,
   * leggyorsabb szerver kiválasztása.
   */

  console.log("  Melyik szerver válaszol előbb?");
  await new Promise<void>((resolve) => {
    const szerver1$ = of("Szerver 1 válasza").pipe(delay(300));
    const szerver2$ = of("Szerver 2 válasza").pipe(delay(100)); // Ez gyorsabb
    const szerver3$ = of("Szerver 3 válasza").pipe(delay(200));

    race(szerver1$, szerver2$, szerver3$)
      .pipe(finalize(() => resolve()))
      .subscribe((v) => console.log(`    Nyertes: ${v}`));
  });

  // ============================================================
  // 7. withLatestFrom() - Pipe operátor kombinálásra
  // ============================================================
  alfejlec("7. withLatestFrom() - Fő stream kiegészítése");

  /**
   * A withLatestFrom() a FŐ stream kibocsátásakor
   * hozzáfűzi a mellékstream LEGFRISSEBB értékét.
   *
   * FONTOS: Csak a fő stream kibocsátásakor ad értéket,
   * a mellékstream kibocsátása önmagában NEM vált ki kimenetet.
   *
   * Fő:      --A------B------C-->
   * Mellék:  ----1--2----3------>
   * withLatestFrom(Mellék)
   * Kimenő:  ---------[B,2]--[C,3]->
   *           ↑ A-nak nincs mellékértéke, kimarad
   */

  console.log("  Kattintás + legfrissebb pozíció:");
  await new Promise<void>((resolve) => {
    const kattintas$ = timer(200, 200).pipe(
      take(4),
      map((i) => `Kattintás #${i}`)
    );
    const egerPozicio$ = timer(0, 100).pipe(
      take(10),
      map((i) => ({ x: i * 50, y: i * 30 }))
    );

    kattintas$
      .pipe(
        withLatestFrom(egerPozicio$),
        finalize(() => resolve())
      )
      .subscribe(([katt, poz]) =>
        console.log(`    ${katt} pozícióban: (${poz.x}, ${poz.y})`)
      );
  });

  // ============================================================
  // 8. startWith() - Kezdőérték hozzáadása
  // ============================================================
  alfejlec("8. startWith() - Kezdőérték megadása");

  /**
   * A startWith() az Observable elejére szúr be értéke(ke)t.
   * Hasznos, ha default/kezdő állapot kell.
   */

  console.log("  Betöltési állapot:");
  of("Adatok betöltve!")
    .pipe(delay(0), startWith("Betöltés..."))
    .subscribe((v) => console.log(`    ${v}`));

  // ============================================================
  // ÖSSZEFOGLALÁS
  // ============================================================
  alfejlec("Összefoglaló táblázat");

  console.log(`
  ┌─────────────────┬───────────────────────────────────────────┐
  │ Operátor        │ Mikor használd?                           │
  ├─────────────────┼───────────────────────────────────────────┤
  │ combineLatest   │ Mindig a legfrissebb kombináció kell      │
  │                 │ (form mezők, szűrők)                      │
  ├─────────────────┼───────────────────────────────────────────┤
  │ merge           │ Több forrás összefésülése                 │
  │                 │ (események összevonása)                   │
  ├─────────────────┼───────────────────────────────────────────┤
  │ concat          │ Egymás után, sorrendben                   │
  │                 │ (szekvenciális lépések)                   │
  ├─────────────────┼───────────────────────────────────────────┤
  │ forkJoin        │ Megvárni mindent (mint Promise.all)       │
  │                 │ (oldal betöltés, inicializálás)           │
  ├─────────────────┼───────────────────────────────────────────┤
  │ zip             │ Páronkénti összekapcsolás                 │
  │                 │ (index-alapú párosítás)                   │
  ├─────────────────┼───────────────────────────────────────────┤
  │ race            │ Az első válaszoló nyer                    │
  │                 │ (timeout, leggyorsabb forrás)             │
  ├─────────────────┼───────────────────────────────────────────┤
  │ withLatestFrom  │ Fő stream + legfrissebb mellékérték       │
  │                 │ (kattintás + aktuális állapot)            │
  └─────────────────┴───────────────────────────────────────────┘`);

  console.log("\n\n>>> Az 05-kombinalo-operatorok.ts bemutatója befejeződött! <<<");
}

main();
