/**
 * ============================================================
 *  08 - KOMPLEX GYAKORLATI PÉLDÁK
 * ============================================================
 *
 *  Valós életből vett, összetett RxJS minták, amelyek
 *  bemutatják, hogyan kombináljuk az eddig tanult
 *  operátorokat valódi feladatok megoldására.
 */

import {
  Observable,
  Subject,
  BehaviorSubject,
  interval,
  timer,
  of,
  from,
  merge,
  combineLatest,
  forkJoin,
  EMPTY,
} from "rxjs";
import {
  map,
  filter,
  switchMap,
  mergeMap,
  concatMap,
  exhaustMap,
  debounceTime,
  distinctUntilChanged,
  takeUntil,
  take,
  scan,
  tap,
  catchError,
  retry,
  finalize,
  delay,
  share,
  shareReplay,
  startWith,
  withLatestFrom,
  reduce,
  toArray,
  bufferTime,
} from "rxjs/operators";
import { fejlec, alfejlec, varakozas } from "./utils";

async function main() {
  // ============================================================
  // 1. PÉLDA: Keresőmező (Typeahead / Autocomplete)
  // ============================================================
  fejlec("1. Keresőmező (Typeahead) - A klasszikus RxJS példa");

  /**
   * A keresőmező implementáció az RxJS egyik legikonikusabb példája.
   * Problémák, amiket megold:
   * 1. Ne küldjön kérést minden billentyűleütésnél (debounceTime)
   * 2. Ne küldjön kérést, ha a szöveg nem változott (distinctUntilChanged)
   * 3. Törölje az előző kérést, ha új jön (switchMap)
   * 4. Kezelje a hibákat (catchError)
   * 5. Ne keressen üres stringre (filter)
   */

  // Szimulált API
  function keresApi(kifejezes: string): Observable<string[]> {
    const adatbazis = [
      "Angular", "AngularJS", "React", "ReactNative",
      "RxJS", "Redux", "Vue", "Vuex", "Svelte", "SvelteKit",
      "Node.js", "Next.js", "Nuxt.js", "Nest.js",
      "TypeScript", "JavaScript",
    ];
    const talalatok = adatbazis.filter((item) =>
      item.toLowerCase().includes(kifejezes.toLowerCase())
    );
    // Szimulált hálózati késleltetés
    return of(talalatok).pipe(delay(80));
  }

  // Szimulált felhasználói gépelés
  const gepeles$ = new Subject<string>();

  const keresesEredmeny$ = gepeles$.pipe(
    debounceTime(150),                                    // 1. Várakozás: 150ms gépelési szünet
    distinctUntilChanged(),                               // 2. Csak ha változott
    filter((kifejezes) => kifejezes.length >= 2),        // 3. Min. 2 karakter
    tap((k) => console.log(`    Keresés: "${k}"`)),
    switchMap((kifejezes) =>                              // 4. Előző kérés törlése
      keresApi(kifejezes).pipe(
        catchError((err) => {                             // 5. Hibakezelés
          console.log(`    Hiba: ${err.message}`);
          return of([]); // Üres eredmény hiba esetén
        })
      )
    )
  );

  keresesEredmeny$.subscribe((talalatok) => {
    if (talalatok.length > 0) {
      console.log(`    Találatok: ${talalatok.join(", ")}`);
    } else {
      console.log("    Nincs találat");
    }
  });

  // Gépelés szimulálása
  setTimeout(() => gepeles$.next("R"), 0);
  setTimeout(() => gepeles$.next("Rx"), 50);       // túl gyors, debounce kiszűri
  setTimeout(() => gepeles$.next("RxJ"), 100);     // túl gyors
  setTimeout(() => gepeles$.next("RxJS"), 150);    // ez marad meg (150ms szünet utána)
  setTimeout(() => gepeles$.next("Re"), 500);      // új keresés
  setTimeout(() => gepeles$.next("React"), 600);   // ez marad meg

  await varakozas(1000);
  gepeles$.complete();

  // ============================================================
  // 2. PÉLDA: Polling (Periodikus adatlekérdezés)
  // ============================================================
  alfejlec("2. Polling - Periodikus adatlekérdezés");

  /**
   * Rendszeres időközönként lekérdezzük a szerver állapotát.
   * Fontos: ha a kérés lassabb, mint a poll intervallum,
   * ne halmozódjanak fel a kérések (switchMap kezeli).
   */

  let pollSzamlalo = 0;

  function szerverAllapot(): Observable<{ status: string; cpu: number }> {
    pollSzamlalo++;
    return of({
      status: pollSzamlalo <= 3 ? "OK" : "Figyelmeztetés",
      cpu: Math.round(Math.random() * 100),
    }).pipe(delay(50));
  }

  console.log("  Szerver polling (200ms-ként, 5 lekérdezés):");
  const stopPolling$ = new Subject<void>();

  await new Promise<void>((resolve) => {
    interval(200)
      .pipe(
        take(5),
        switchMap(() => szerverAllapot()),
        tap((allapot) => {
          if (allapot.status !== "OK") {
            console.log(`    ⚠ FIGYELMEZTETÉS! CPU: ${allapot.cpu}%`);
          }
        }),
        takeUntil(stopPolling$),
        finalize(() => resolve())
      )
      .subscribe((allapot) =>
        console.log(
          `    [Poll #${pollSzamlalo}] Status: ${allapot.status}, CPU: ${allapot.cpu}%`
        )
      );
  });

  // ============================================================
  // 3. PÉLDA: Egyszerű cache (shareReplay)
  // ============================================================
  alfejlec("3. Cache - shareReplay()-vel");

  /**
   * A shareReplay(1) megoldja, hogy:
   * - Többszöri feliratkozás NE indítson új API hívást
   * - Az utolsó eredményt cache-ből kapja a következő feliratkozó
   *
   * Ez egy "multicast + replay" kombináció.
   */

  let apiHivasokSzama = 0;

  function drogaApiHivas(): Observable<string> {
    apiHivasokSzama++;
    console.log(`    [API] Hívás #${apiHivasokSzama} (drága művelet!)`);
    return of("Fontos adat a szerverről").pipe(delay(100));
  }

  // CACHE NÉLKÜL: minden feliratkozás új API hívás
  console.log("  Cache NÉLKÜL (3 feliratkozás = 3 API hívás):");
  const nemCachelt$ = drogaApiHivas();
  apiHivasokSzama = 0;

  await new Promise<void>((resolve) => {
    forkJoin([
      drogaApiHivas(),
      drogaApiHivas(),
      drogaApiHivas(),
    ])
      .pipe(finalize(() => resolve()))
      .subscribe(() => console.log(`    Összes API hívás: ${apiHivasokSzama}`));
  });

  // CACHE-EL: shareReplay(1) használata
  apiHivasokSzama = 0;
  console.log("\n  Cache-EL - shareReplay(1) (3 feliratkozás = 1 API hívás):");

  const cachelt$ = drogaApiHivas().pipe(shareReplay(1));

  await new Promise<void>((resolve) => {
    let befejezetlenFeliratkozasok = 3;
    const ellenorzes = () => {
      befejezetlenFeliratkozasok--;
      if (befejezetlenFeliratkozasok === 0) {
        console.log(`    Összes API hívás: ${apiHivasokSzama}`);
        resolve();
      }
    };

    cachelt$.pipe(finalize(ellenorzes)).subscribe((v) =>
      console.log(`    [A] Kapott: ${v}`)
    );
    cachelt$.pipe(finalize(ellenorzes)).subscribe((v) =>
      console.log(`    [B] Kapott: ${v}`)
    );
    // Késleltetett feliratkozás - cache-ből kapja
    setTimeout(() => {
      cachelt$.pipe(finalize(ellenorzes)).subscribe((v) =>
        console.log(`    [C - késleltetett] Kapott: ${v}`)
      );
    }, 200);
  });

  // ============================================================
  // 4. PÉLDA: Párhuzamos kérések eredményeinek összegyűjtése
  // ============================================================
  alfejlec("4. Párhuzamos kérések összegyűjtése");

  /**
   * Több párhuzamos API hívás, de:
   * - Maximum 2 fut egyszerre (concurrency limit)
   * - Az összes eredményt összegyűjtjük
   * - Egy hibás kérés ne állítsa le a többit
   */

  interface Termek {
    id: number;
    nev: string;
    ar: number;
  }

  function termekLetoltes(id: number): Observable<Termek> {
    if (id === 3) {
      // A 3-as termék "hibás"
      return timer(50).pipe(
        switchMap(() => {
          throw new Error(`Termék #${id} nem található`);
        })
      );
    }
    return of({
      id,
      nev: `Termék #${id}`,
      ar: id * 1000 + Math.round(Math.random() * 500),
    }).pipe(delay(50 + Math.random() * 100));
  }

  console.log("  5 termék párhuzamos letöltése (max 2 egyszerre):");
  await new Promise<void>((resolve) => {
    from([1, 2, 3, 4, 5])
      .pipe(
        mergeMap(
          (id) =>
            termekLetoltes(id).pipe(
              catchError((err) => {
                console.log(`    ✗ Hiba: ${err.message}`);
                return EMPTY; // Kihagyjuk a hibás terméket
              })
            ),
          2 // Concurrency limit: max 2 párhuzamos kérés
        ),
        toArray(),
        finalize(() => resolve())
      )
      .subscribe((termekek) => {
        console.log(`    Sikeresen letöltött termékek: ${termekek.length} db`);
        termekek.forEach((t) =>
          console.log(`      - ${t.nev}: ${t.ar} Ft`)
        );
      });
  });

  // ============================================================
  // 5. PÉLDA: Reaktív állapotkezelés (State Management)
  // ============================================================
  alfejlec("5. Reaktív állapotkezelés - Mini Redux");

  /**
   * Egy egyszerű, Redux-szerű állapotkezelés RxJS-sel.
   * - Akciók (Subject-ek) → Reducer (scan) → Állapot (BehaviorSubject)
   */

  // Állapot definíció
  interface TodoAllapot {
    feladatok: { id: number; szoveg: string; kesz: boolean }[];
    szuro: "osszes" | "aktiv" | "kesz";
  }

  // Akció típusok
  type TodoAkcio =
    | { tipus: "HOZZAAD"; szoveg: string }
    | { tipus: "PIPAL"; id: number }
    | { tipus: "TOROL"; id: number }
    | { tipus: "SZURO_VALTAS"; szuro: "osszes" | "aktiv" | "kesz" };

  // Akció stream
  const akcio$ = new Subject<TodoAkcio>();

  // Kezdőállapot
  const kezdoAllapot: TodoAllapot = {
    feladatok: [],
    szuro: "osszes",
  };

  let kovetkezoId = 1;

  // Reducer: akció + régi állapot → új állapot
  const allapot$ = akcio$.pipe(
    scan((allapot: TodoAllapot, akcio: TodoAkcio): TodoAllapot => {
      switch (akcio.tipus) {
        case "HOZZAAD":
          return {
            ...allapot,
            feladatok: [
              ...allapot.feladatok,
              { id: kovetkezoId++, szoveg: akcio.szoveg, kesz: false },
            ],
          };
        case "PIPAL":
          return {
            ...allapot,
            feladatok: allapot.feladatok.map((f) =>
              f.id === akcio.id ? { ...f, kesz: !f.kesz } : f
            ),
          };
        case "TOROL":
          return {
            ...allapot,
            feladatok: allapot.feladatok.filter((f) => f.id !== akcio.id),
          };
        case "SZURO_VALTAS":
          return { ...allapot, szuro: akcio.szuro };
      }
    }, kezdoAllapot),
    startWith(kezdoAllapot),
    shareReplay(1)
  );

  // Szűrt feladatok (derived state)
  const szurtFeladatok$ = allapot$.pipe(
    map((a) => {
      switch (a.szuro) {
        case "aktiv":
          return a.feladatok.filter((f) => !f.kesz);
        case "kesz":
          return a.feladatok.filter((f) => f.kesz);
        default:
          return a.feladatok;
      }
    }),
    distinctUntilChanged()
  );

  // Feliratkozás - nézet frissítése
  szurtFeladatok$.subscribe((feladatok) => {
    if (feladatok.length === 0) {
      console.log("    [Nézet] Nincsenek feladatok");
    } else {
      console.log("    [Nézet] Feladatok:");
      feladatok.forEach((f) =>
        console.log(`      ${f.kesz ? "✓" : "○"} ${f.szoveg}`)
      );
    }
  });

  // Akciók végrehajtása
  console.log("  >> Feladatok hozzáadása:");
  akcio$.next({ tipus: "HOZZAAD", szoveg: "RxJS tanulás" });
  akcio$.next({ tipus: "HOZZAAD", szoveg: "TypeScript gyakorlás" });
  akcio$.next({ tipus: "HOZZAAD", szoveg: "Angular projekt" });

  console.log("  >> 'RxJS tanulás' kipipálása:");
  akcio$.next({ tipus: "PIPAL", id: 1 });

  console.log("  >> Szűrés: csak aktív feladatok:");
  akcio$.next({ tipus: "SZURO_VALTAS", szuro: "aktiv" });

  console.log("  >> Szűrés: csak kész feladatok:");
  akcio$.next({ tipus: "SZURO_VALTAS", szuro: "kesz" });

  console.log("  >> Szűrés visszaállítása:");
  akcio$.next({ tipus: "SZURO_VALTAS", szuro: "osszes" });

  akcio$.complete();

  // ============================================================
  // 6. PÉLDA: Rate limiter (Sebességkorlátozó)
  // ============================================================
  alfejlec("6. Rate Limiter - Kérések sebességkorlátozása");

  /**
   * Korlátozzuk, hogy maximum N kérés menjen ki egy
   * adott időablakon belül (pl. API rate limit betartása).
   *
   * bufferTime() + concatMap segítségével csoportosítjuk
   * és ütemezzük a kéréseket.
   */

  function rateLimitedApi(id: number): Observable<string> {
    return of(`API válasz #${id}`).pipe(delay(20));
  }

  console.log("  10 kérés, max 3 darab / 200ms időablak:");
  await new Promise<void>((resolve) => {
    from([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
      .pipe(
        bufferTime(200),                // 200ms-os ablakokba gyűjti
        filter((csop) => csop.length > 0),
        concatMap((csoport) => {
          console.log(
            `    [Köteg] ${csoport.length} kérés indítása: [${csoport}]`
          );
          return from(csoport).pipe(
            mergeMap((id) => rateLimitedApi(id), 3) // Max 3 párhuzamos
          );
        }),
        toArray(),
        finalize(() => resolve())
      )
      .subscribe((eredmenyek) => {
        console.log(`    Összes feldolgozva: ${eredmenyek.length} kérés`);
      });
  });

  // ============================================================
  // 7. PÉLDA: Event sourcing minta
  // ============================================================
  alfejlec("7. Event Sourcing - Pénzügyi tranzakciók");

  /**
   * Eseményalapú architektúra: minden változás egy esemény,
   * az aktuális állapot az események összegzéséből áll elő.
   */

  type Tranzakcio =
    | { tipus: "BEFIZETÉS"; osszeg: number; megjegyzes: string }
    | { tipus: "KIVÉT"; osszeg: number; megjegyzes: string }
    | { tipus: "KAMAT"; szazalek: number };

  interface SzamlaAllapot {
    egyenleg: number;
    tranzakcioSzam: number;
    utolsoMuvelet: string;
  }

  const tranzakciok$ = from<Tranzakcio[]>([
    { tipus: "BEFIZETÉS", osszeg: 100000, megjegyzes: "Nyitó befizetés" },
    { tipus: "BEFIZETÉS", osszeg: 50000, megjegyzes: "Fizetés" },
    { tipus: "KIVÉT", osszeg: 20000, megjegyzes: "Bevásárlás" },
    { tipus: "KAMAT", szazalek: 2 },
    { tipus: "KIVÉT", osszeg: 15000, megjegyzes: "Számla" },
  ]);

  tranzakciok$
    .pipe(
      scan(
        (allapot: SzamlaAllapot, tranzakcio: Tranzakcio): SzamlaAllapot => {
          switch (tranzakcio.tipus) {
            case "BEFIZETÉS":
              return {
                egyenleg: allapot.egyenleg + tranzakcio.osszeg,
                tranzakcioSzam: allapot.tranzakcioSzam + 1,
                utolsoMuvelet: `+${tranzakcio.osszeg} Ft (${tranzakcio.megjegyzes})`,
              };
            case "KIVÉT":
              return {
                egyenleg: allapot.egyenleg - tranzakcio.osszeg,
                tranzakcioSzam: allapot.tranzakcioSzam + 1,
                utolsoMuvelet: `-${tranzakcio.osszeg} Ft (${tranzakcio.megjegyzes})`,
              };
            case "KAMAT":
              const kamat = Math.round(
                allapot.egyenleg * (tranzakcio.szazalek / 100)
              );
              return {
                egyenleg: allapot.egyenleg + kamat,
                tranzakcioSzam: allapot.tranzakcioSzam + 1,
                utolsoMuvelet: `+${kamat} Ft (${tranzakcio.szazalek}% kamat)`,
              };
          }
        },
        { egyenleg: 0, tranzakcioSzam: 0, utolsoMuvelet: "" }
      )
    )
    .subscribe((allapot) =>
      console.log(
        `    #${allapot.tranzakcioSzam} ${allapot.utolsoMuvelet} → Egyenleg: ${allapot.egyenleg} Ft`
      )
    );

  // ============================================================
  // 8. PÉLDA: Drag and drop szimuláció
  // ============================================================
  alfejlec("8. Drag and Drop - Egérmozgás szimuláció");

  /**
   * Drag and Drop implementáció mintája:
   * mousedown → mousemove (takeUntil mouseup) → mouseup
   *
   * Ez a minta jól demonstrálja a takeUntil erejét.
   */

  const mouseDown$ = new Subject<{ x: number; y: number }>();
  const mouseMove$ = new Subject<{ x: number; y: number }>();
  const mouseUp$ = new Subject<void>();

  // Drag stream: mouseDown → mouseMove (amíg mouseUp)
  const drag$ = mouseDown$.pipe(
    switchMap((startPoz) =>
      mouseMove$.pipe(
        map((mozgasPoz) => ({
          startX: startPoz.x,
          startY: startPoz.y,
          currentX: mozgasPoz.x,
          currentY: mozgasPoz.y,
          deltaX: mozgasPoz.x - startPoz.x,
          deltaY: mozgasPoz.y - startPoz.y,
        })),
        takeUntil(mouseUp$)
      )
    )
  );

  drag$.subscribe((d) =>
    console.log(
      `    Húzás: (${d.startX},${d.startY}) → (${d.currentX},${d.currentY}) Δ(${d.deltaX},${d.deltaY})`
    )
  );

  // Szimuláció
  console.log("  >> Egér lenyomva (100, 100)");
  mouseDown$.next({ x: 100, y: 100 });
  mouseMove$.next({ x: 110, y: 105 });
  mouseMove$.next({ x: 130, y: 115 });
  mouseMove$.next({ x: 160, y: 130 });
  console.log("  >> Egér felengedve");
  mouseUp$.next();
  mouseMove$.next({ x: 200, y: 200 }); // Ez NEM jelenik meg (drag befejeződött)

  console.log("  >> Újabb drag:");
  mouseDown$.next({ x: 50, y: 50 });
  mouseMove$.next({ x: 70, y: 60 });
  mouseUp$.next();

  mouseDown$.complete();
  mouseMove$.complete();
  mouseUp$.complete();

  console.log(`


${"=".repeat(60)}
  GRATULÁLOK! Az RxJS bemutató összes fejezete befejeződött!
${"=".repeat(60)}

  Áttekintett témák:
  01 - Alapok (Observable, Observer, Subscription)
  02 - Létrehozó operátorok (of, from, interval, timer, stb.)
  03 - Átalakító operátorok (map, switchMap, mergeMap, stb.)
  04 - Szűrő operátorok (filter, take, debounceTime, stb.)
  05 - Kombináló operátorok (combineLatest, merge, forkJoin, stb.)
  06 - Subjects (Subject, BehaviorSubject, ReplaySubject, stb.)
  07 - Hibakezelés (catchError, retry, timeout, stb.)
  08 - Komplex példák (keresőmező, polling, cache, state, stb.)

  Futtatás: npm run 01 ... npm run 08
`);
}

main();
