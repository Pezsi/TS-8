/**
 * Segédfüggvények a bemutató példákhoz
 */

// Fejléc kiírása a konzolra - vizuálisan elválasztja a példákat
export function fejlec(cim: string): void {
  console.log("\n" + "=".repeat(60));
  console.log(`  ${cim}`);
  console.log("=".repeat(60));
}

// Alfejléc kiírása
export function alfejlec(cim: string): void {
  console.log(`\n--- ${cim} ---`);
}

// Várakozás (async példákhoz)
export function varakozas(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
