/*
  Kozvetlen platform API eleres -- a NativeScript legnagyobb erosssege

  Ez az a kepessseg, ami a NativeScript-et igazan egyedive teszi.
  Mig mas keretrendszerekneel (React Native, Flutter, Ionic) plugin-okra
  van szukseged a nativ funkciok elereshehez, a NativeScript-ben
  KOZVETLENUL hivhatod az Android es iOS API-kat TypeScript-bol.

  Ez azt jelenti, hogy ha az Android SDK-ban vagy az iOS SDK-ban letezik
  egy funkccio, azt azonnal hasznalhatod -- nem kell megvarnod, hogy
  valaki irjon hozza egy JavaScript wrapper-t.

  Miert fontos ez? Mert a mobil vilag gyorsan valtozik. Uj szenzorok,
  uj biztonsagi funkciok, uj operacios rendszer kepessegek jelennek meg
  evente. A NativeScript-tel ezeket azonnal, a megjelenes napjan
  eerheted el.
*/

import { Application, Device, Screen, isAndroid, isIOS } from "@nativescript/core";


/* --- 1. Platform detektalas ---

  Az elso es legalapvetobb dolog: hogyan tudjuk meg, melyik platformon
  futunk? Azert fontos, mert az Android es iOS API-k teljesen
  kuuloboznek (mas osztaalynevek, mas metodusok, mas koncepciok).
*/

function platformInfo(): void {
  // Ezek mindenhol elerhetook, nem kellenek platformspecifikus importok
  console.log("Platform:", isAndroid ? "Android" : "iOS");
  console.log("Eszkoz tipus:", Device.deviceType); // "Phone" vagy "Tablet"
  console.log("OS verzio:", Device.osVersion);     // pl. "14.0" (iOS) vagy "13" (Android)
  console.log("Nyelv:", Device.language);           // pl. "hu"
  console.log("Gyarto:", Device.manufacturer);     // pl. "Samsung", "Apple"
  console.log("Modell:", Device.model);             // pl. "Pixel 7", "iPhone 15"

  console.log("Kepernyo szelesseg:", Screen.mainScreen.widthDIPs, "DIP");
  console.log("Kepernyo magassag:", Screen.mainScreen.heightDIPs, "DIP");
  console.log("Kepernyo surusseg:", Screen.mainScreen.scale);
}


/* --- 2. Platformspecifikus fajlok ---

  A NativeScript egy elegaans megoldast kinal a platformspecifikus kod
  kezelesere: ha egy fajlnak lertrehozod a .android.ts es .ios.ts
  valtozatat, a build rendszer automatikusan a megfelelo verzioot
  hasznalja.

  Pelda:
    utils.ts          -- kozos kod (ha nincsenek platformspecifikus valtozatok)
    utils.android.ts  -- csak Android-on hasznalt kod
    utils.ios.ts      -- csak iOS-en hasznalt kod

  Amikor importaalsz: import { valami } from "./utils";
  A NativeScript automatikusan a platform szerinti fajlt toltiti be.

  Ez sokkal tisztabb, mint mindenhol if (isAndroid) {} else {} agakat irni.
*/


/* --- 3. Android API hivas TypeScript-bol ---

  Az Android API-k a "java.", "android.", "javax." stb. nevtereken
  keresztul erhetook el. A NativeScript runtime automatikusan elerhetove
  teszi az egesz Android SDK-t.
*/

// Pelda: eszkoz vibracio Android-on
function vibralj(): void {
  if (!isAndroid) {
    console.log("Ez a funkccio csak Android-on mukodik");
    return;
  }

  // @ts-ignore -- a nativ tipusok valos eszkozoon elerhetook
  // const context = Application.android.context;
  // const vibratorService = context.getSystemService(
  //   android.content.Context.VIBRATOR_SERVICE
  // );
  //
  // // Android 26+ (Oreo) eseten VibrationEffect-et hasznalunk
  // if (android.os.Build.VERSION.SDK_INT >= 26) {
  //   const effect = android.os.VibrationEffect.createOneShot(
  //     200, // milliszekundum
  //     android.os.VibrationEffect.DEFAULT_AMPLITUDE
  //   );
  //   vibratorService.vibrate(effect);
  // } else {
  //   vibratorService.vibrate(200);
  // }

  console.log("Vibracioparancs elkuldve (valos eszkozoon mukodik)");
}

// Pelda: Android Toast uzenet (az a felugro uzenet a kepernyoo aljan)
function androidToast(uzenet: string): void {
  if (!isAndroid) return;

  // @ts-ignore
  // const context = Application.android.context;
  // android.widget.Toast
  //   .makeText(context, uzenet, android.widget.Toast.LENGTH_SHORT)
  //   .show();

  console.log(`Toast: "${uzenet}" (valos eszkozoon jelenik meg)`);
}


/* --- 4. iOS API hivas TypeScript-bol ---

  Az iOS API-k (UIKit, Foundation, stb.) szinten kozvetlenul elerhetook.
  Az Objective-C es Swift API-k szintaxisa kicsit maskepp nez ki
  TypeScript-ben, de kovetkezetesen: a szelektorok (metodus nevek)
  osszefuzodnek.
*/

// Pelda: iOS UIAlertController -- nativ felugro ablak
function iosNativAlert(cim: string, uzenet: string): void {
  if (!isIOS) {
    console.log("Ez a funkccio csak iOS-en mukodik");
    return;
  }

  // @ts-ignore
  // const alertController = UIAlertController.alertControllerWithTitleMessagePreferredStyle(
  //   cim,
  //   uzenet,
  //   UIAlertControllerStyle.Alert
  // );
  //
  // const okAction = UIAlertAction.actionWithTitleStyleHandler(
  //   "OK",
  //   UIAlertActionStyle.Default,
  //   null
  // );
  // alertController.addAction(okAction);
  //
  // // A legfelso viewController-en jelenltjuk meg
  // const rootVC = Application.ios.rootController;
  // rootVC.presentViewControllerAnimatedCompletion(alertController, true, null);

  console.log(`iOS Alert: "${cim}" - "${uzenet}" (valos eszkozoon jelenik meg)`);
}


/* --- 5. Fajlrendszer kezeles ---

  A fajlrendszerhez mind a NativeScript sajat API-jan, mind kozvetlenul
  a nativ API-kon keresztul hozzaafhetsz. A NativeScript sajat File es
  Folder osztalyai multiplatformosak -- ugyanaz a kod mukodik Android-on
  es iOS-en is.
*/

import { File, Folder, knownFolders } from "@nativescript/core";

function fajlrendszerPelda(): void {
  // Ismert mappak -- platformfuggetlenek
  const dokumentumok = knownFolders.documents();
  const temp = knownFolders.temp();
  const app = knownFolders.currentApp();

  console.log("Dokumentumok mappa:", dokumentumok.path);
  console.log("Temp mappa:", temp.path);
  console.log("Alkalmazas mappa:", app.path);

  // Fajl irasa
  const fajlUtvonal = Folder.join(dokumentumok.path, "beallitasok.json");
  const fajl = File.fromPath(fajlUtvonal);

  const adat = { tema: "sotet", nyelv: "hu" };
  fajl.writeTextSync(JSON.stringify(adat));
  console.log("Fajl kiirva:", fajlUtvonal);

  // Fajl olvasasa
  const tartalom = fajl.readTextSync();
  const beolvasottAdat = JSON.parse(tartalom);
  console.log("Beolvasott adat:", beolvasottAdat);

  // Mappa tartalmanak listazasa
  const mappaTartalom = dokumentumok.getEntitiesSync();
  mappaTartalom.forEach((elem) => {
    const tipus = elem instanceof Folder ? "mappa" : "fajl";
    console.log(`  ${tipus}: ${elem.name}`);
  });
}


/* --- 6. HTTP keresek --- */

import { Http } from "@nativescript/core";

async function apiHivasPelda(): Promise<void> {
  // A NativeScript sajat Http modulja platformfuggetlen
  try {
    const valasz = await Http.request({
      url: "https://jsonplaceholder.typicode.com/users/1",
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (valasz.statusCode === 200) {
      const adat = valasz.content.toJSON();
      console.log("Felhasznalo neve:", adat.name);
    } else {
      console.log("Hiba, statusz kod:", valasz.statusCode);
    }
  } catch (hiba) {
    console.error("Halozati hiba:", hiba);
  }
}


/* --- 7. Eszkoz szenzor pelda: gyorsulasmero ---

  Ez csak egy pelda arra, hogyan erhetsz el hardver szenzorokat.
  A konkret implementacio platformfuggo, de a NativeScript lehetove
  teszi, hogy egyetlen TypeScript fajlbol kezeld.
*/

function gyorsulasmeroPelda(): void {
  if (!isAndroid) return;

  // @ts-ignore
  // const sensorManager = Application.android.context.getSystemService(
  //   android.content.Context.SENSOR_SERVICE
  // );
  // const accelerometer = sensorManager.getDefaultSensor(
  //   android.hardware.Sensor.TYPE_ACCELEROMETER
  // );
  //
  // const listener = new android.hardware.SensorEventListener({
  //   onSensorChanged: function(event: android.hardware.SensorEvent) {
  //     const x = event.values[0];
  //     const y = event.values[1];
  //     const z = event.values[2];
  //     console.log(`Gyorsulas: x=${x}, y=${y}, z=${z}`);
  //   },
  //   onAccuracyChanged: function() {}
  // });
  //
  // sensorManager.registerListener(listener, accelerometer,
  //   android.hardware.SensorManager.SENSOR_DELAY_NORMAL);

  console.log("Gyorsulasmero figyeles inditva (valos eszkozoon mukodik)");
}


/* --- Osszefoglalas ---

  - A NativeScript kozvetlenul eleri az Android es iOS API-kat
  - Nincs szukseg plugin-okra a legtobb nativ funkciohoz
  - Platformspecifikus fajlok (.android.ts, .ios.ts) kezelik az eltereseket
  - A NativeScript sajat API-jai (File, Http, stb.) multiplatformosak
  - A @nativescript/types csomag tipusbiztonsagot ad a nativ API hivlasokhoz

  A kovetkezo fajlban megnezzuk az adatkezelest es a data binding rendszert.
*/

export {
  platformInfo,
  vibralj,
  androidToast,
  iosNativAlert,
  fajlrendszerPelda,
  apiHivasPelda,
};
