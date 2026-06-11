/**
 * ============================================================
 *  06 - SUBJECTS
 * ============================================================
 *
 *  A Subject egyszerre Observable ÉS Observer.
 *  - Observable: feliratkozhatsz rá (.subscribe())
 *  - Observer:   értéket küldhetsz rajta (.next(), .error(), .complete())
 *
 *  Ez teszi lehetővé a "multicasting"-ot: egy forrásból
 *  több feliratkozó kapja UGYANAZT az adatot.
 *
 *  Ez a HOT Observable koncepció (ellentétben a COLD-dal).
 *  Gondolj rá úgy, mint egy élő közvetítésre.
 */

import { Subject, BehaviorSubject, ReplaySubject, AsyncSubject } from "rxjs";
import { fejlec, alfejlec, varakozas } from "./utils";

async function main() {
  // ============================================================
  // 1. Subject - Alap multicast
  // ============================================================
  fejlec("1. Subject - Alap multicast");

  /**
   * A sima Subject:
   * - Nem tárol korábbi értékeket
   * - Aki később iratkozik fel, LEMARAD a korábbi értékekről
   * - Mint egy élő TV adás: amit lekéstél, az ment
   */

  const subject = new Subject<string>();

  // 1. feliratkozó - ő már az elejétől figyel
  subject.subscribe((v) => console.log(`  [Feliratkozó A] ${v}`));

  subject.next("Első üzenet");
  subject.next("Második üzenet");

  // 2. feliratkozó - ő később csatlakozik
  console.log("  >> B feliratkozó csatlakozik");
  subject.subscribe((v) => console.log(`  [Feliratkozó B] ${v}`));

  subject.next("Harmadik üzenet"); // Ezt mindketten megkapják
  subject.complete();
  // Figyeld meg: B nem kapta meg az Első és Második üzenetet!

  // ============================================================
  // 2. BehaviorSubject - Mindig van aktuális érték
  // ============================================================
  alfejlec("2. BehaviorSubject - Aktuális érték tárolása");

  /**
   * A BehaviorSubject:
   * - KÖTELEZŐ kezdőértéket adni
   * - Mindig megjegyzi a LEGUTOLSÓ értéket
   * - Új feliratkozó AZONNAL megkapja a legutolsó értéket
   * - A .value property-vel szinkronban is lekérdezhető
   *
   * Tipikus felhasználás:
   * - Felhasználói állapot (bejelentkezve/kijelentkezve)
   * - Aktuális kiválasztott elem
   * - Alkalmazás beállítások
   * - Angular service-ben store-ként
   */

  const felhasznaloAllapot$ = new BehaviorSubject<string>("Vendég");

  console.log(
    `  Aktuális érték (.value): "${felhasznaloAllapot$.value}"`
  );

  // A feliratkozó AZONNAL megkapja az aktuális értéket
  console.log("  >> A feliratkozik:");
  felhasznaloAllapot$.subscribe((v) =>
    console.log(`  [Feliratkozó A] Állapot: ${v}`)
  );

  felhasznaloAllapot$.next("Anna (bejelentkezve)");

  // B később iratkozik fel - de azonnal megkapja a legutolsót
  console.log("  >> B feliratkozik:");
  felhasznaloAllapot$.subscribe((v) =>
    console.log(`  [Feliratkozó B] Állapot: ${v}`)
  );

  felhasznaloAllapot$.next("Anna (admin mód)");
  felhasznaloAllapot$.complete();

  // ============================================================
  // 3. Gyakorlati példa: Egyszerű Store BehaviorSubject-tel
  // ============================================================
  alfejlec("3. Gyakorlati példa: Mini Store");

  /**
   * A BehaviorSubject tökéletes egyszerű állapotkezelésre.
   * Ez az Angular service-ek egyik leggyakoribb mintája.
   */

  interface AppState {
    szamlalo: number;
    tema: "vilagos" | "sotet";
    nyelv: string;
  }

  class MiniStore {
    private allapot$ = new BehaviorSubject<AppState>({
      szamlalo: 0,
      tema: "vilagos",
      nyelv: "hu",
    });

    // Kívülről csak Observable-ként érhető el (nem módosítható)
    getAllapot$() {
      return this.allapot$.asObservable();
    }

    // Aktuális érték szinkron lekérdezése
    getAktualis(): AppState {
      return this.allapot$.value;
    }

    // Állapot frissítése (részleges update)
    frissit(reszleges: Partial<AppState>): void {
      this.allapot$.next({
        ...this.allapot$.value,
        ...reszleges,
      });
    }
  }

  const store = new MiniStore();

  store.getAllapot$().subscribe((allapot) =>
    console.log(
      `  [Store] száml: ${allapot.szamlalo}, ` +
        `téma: ${allapot.tema}, nyelv: ${allapot.nyelv}`
    )
  );

  store.frissit({ szamlalo: 1 });
  store.frissit({ tema: "sotet" });
  store.frissit({ szamlalo: 2, nyelv: "en" });

  // ============================================================
  // 4. ReplaySubject - Korábbi értékek visszajátszása
  // ============================================================
  alfejlec("4. ReplaySubject - Korábbi értékek visszajátszása");

  /**
   * A ReplaySubject:
   * - Meghatározható, hány korábbi értéket tároljon (buffer)
   * - Új feliratkozó megkapja az utolsó N értéket
   *
   * ReplaySubject(1) ≈ BehaviorSubject (de nincs kötelező kezdőérték)
   * ReplaySubject(Infinity) = minden korábbi értéket visszajátssza
   *
   * Tipikus felhasználás:
   * - Chat üzenetek (utolsó N üzenet megjelenítése)
   * - Napló/log megtekintése
   * - Lemaradt események pótlása
   */

  // Az utolsó 3 értéket tároljuk
  const chatUzenetek$ = new ReplaySubject<string>(3);

  chatUzenetek$.next("09:00 - Anna: Sziasztok!");
  chatUzenetek$.next("09:01 - Béla: Hello!");
  chatUzenetek$.next("09:02 - Anna: Hogy vagytok?");
  chatUzenetek$.next("09:05 - Csilla: Jól!"); // Ez kiszorítja az elsőt

  // Csilla később csatlakozik - megkapja az utolsó 3 üzenetet
  console.log("  >> Dávid belép a chatbe és látja az utolsó 3 üzenetet:");
  chatUzenetek$.subscribe((uzenet) => console.log(`    ${uzenet}`));

  // ============================================================
  // 5. AsyncSubject - Csak a legutolsó érték, complete után
  // ============================================================
  alfejlec("5. AsyncSubject - Végső érték a befejezéskor");

  /**
   * Az AsyncSubject:
   * - CSAK a complete() után bocsátja ki az utolsó értéket
   * - Ha nincs complete(), soha nem ad értéket
   *
   * Viselkedése hasonlít a Promise-hoz!
   *
   * Tipikus felhasználás:
   * - Hosszú számítás végeredménye
   * - API hívás, ahol csak a végső válasz érdekel
   */

  const szamitas$ = new AsyncSubject<string>();

  szamitas$.subscribe((v) =>
    console.log(`  [Feliratkozó A] Eredmény: ${v}`)
  );

  szamitas$.next("Köztes eredmény 1"); // Ezt senki nem kapja meg
  szamitas$.next("Köztes eredmény 2"); // Ezt sem
  szamitas$.next("VÉGSŐ eredmény"); // Csak EZT kapják meg

  // B feliratkozik complete előtt
  szamitas$.subscribe((v) =>
    console.log(`  [Feliratkozó B] Eredmény: ${v}`)
  );

  szamitas$.complete(); // MOST kapják meg mindketten a "VÉGSŐ eredmény"-t

  // C feliratkozik complete UTÁN - ő is megkapja
  szamitas$.subscribe((v) =>
    console.log(`  [Feliratkozó C] Eredmény: ${v}`)
  );

  // ============================================================
  // ÖSSZEFOGLALÁS
  // ============================================================
  alfejlec("Összefoglaló: Melyik Subject-et mikor?");

  console.log(`
  ┌───────────────────┬──────────────────────────────────────────┐
  │ Subject típus     │ Jellemző és használat                    │
  ├───────────────────┼──────────────────────────────────────────┤
  │ Subject           │ Nincs kezdőérték, nincs visszajátszás    │
  │                   │ → Egyszerű event bus                     │
  ├───────────────────┼──────────────────────────────────────────┤
  │ BehaviorSubject   │ Mindig van aktuális érték, 1 visszajátsz│
  │                   │ → Állapotkezelés (state management)      │
  ├───────────────────┼──────────────────────────────────────────┤
  │ ReplaySubject(N)  │ Utolsó N értéket visszajátssza           │
  │                   │ → Chat, napló, lemaradt események        │
  ├───────────────────┼──────────────────────────────────────────┤
  │ AsyncSubject      │ Csak a végső értéket adja (complete után)│
  │                   │ → Egyetlen végeredmény (mint Promise)    │
  └───────────────────┴──────────────────────────────────────────┘`);

  console.log("\n\n>>> A 06-subjects.ts bemutatója befejeződött! <<<");
}

main();
