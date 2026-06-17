/*
  A NativeScript architekturaja -- hogyan mukodik belulrol?

  Ahhoz, hogy igazaan hateekonyan hasznald a NativeScript-et, erdemes
  megerteni, mi tortenik a hatterben, amikor a TypeScript koodod
  nativ mobilalkalmazassa valik. Ez nem magia -- egy jol atgondolt,
  elegans technikai megoldas.

  A fo kerdes: hogyan lehetseges, hogy JavaScript/TypeScript kodbol
  nativ Android es iOS alkalmazas lesz, minden bridge vagy WebView
  nelkul?
*/


/* --- 1. A JavaScript runtime ---

  A NativeScript alkalmazas lelke egy JavaScript engine (motor), ami
  a telefonon fut:

  - Android-on: V8 (ugyanaz a motor, ami a Chrome bongeszoben es
    a Node.js-ben fut). Ez egy nagyon gyors, jol optimalizalt motor,
    amit a Google fejleszt.

  - iOS-en: JavaScriptCore (JSC), ami a Safari bongeszomotorjanak
    resze. Az Apple biztonsagi korlatozasai miatt iOS-en nem hasznalhat
    mas JavaScript motort, mint a rendszerbe epitettet.

  Fontos: ez NEM egy bongeszo motor. Nincs DOM, nincs window objektum,
  nincs document.getElementById. Ez tisztan JavaScript futtato kornyezet,
  ami kozvetlenul a nativ API-khoz kapcsolodik.
*/

// Demonstracio: a runtime kornyezet tulajdonsagai
function runtimeInfo(): void {
  // A NativeScript globalis valtozoi a platform informacioit adjak
  // (Ezek valos eszkozoon elerhetook)

  // global.isAndroid -- true ha Android-on fut
  // global.isIOS -- true ha iOS-en fut

  // A __dirname es hasonlo Node.js globalisok NEM elerhetoek,
  // mert ez nem Node.js kornyezet, hanem mobil runtime.

  console.log("Ez a kod a telefon JavaScript motorjaban fut");
  console.log("Nem bongeszooben, nem Node.js-ben -- a mobil eszkozoon");
}


/* --- 2. A metadata es a tipusgeneralas ---

  A NativeScript legizgalmasabb resze az, ahogyan a nativ API-kat
  elerhetove teszi JavaScript-bol. Ennek a titka a metadata generaalas:

  Build idoben a NativeScript CLI:
  1. Vegigscanneli az Android SDK-t vagy az iOS SDK-t
  2. Kinyeri az osszes elerheto osztaly, metodus, property informaciojat
  3. Ebbol generaal egy metadata adatbazist
  4. Ezt az adatbazist becsomagolja az alkalmazasba

  Futas kozben, amikor a JavaScript koodod hivatkozik egy nativ osztaalyra
  (pl. android.widget.Button), a runtime:
  1. Megkeresi a metadataban az osztaly informacioit
  2. Letrehozza a megfelelo JavaScript proxy objektumot
  3. A proxy objektumon vegzett muveletek kozvetlenul a nativ oldaon
     hajtodnak vegre

  Ez az, amiert nincs szukseg bridge-re: a JavaScript motor kozvetlenul,
  szinkron modon eri el a nativ API-kat.
*/

// Pelda: hogyan lesz a TS kodbol nativ UI

// Ez a TypeScript kod...
function demonstracioUILetrehozas(): void {
  // @ts-ignore -- nativ tipusok valos eszkozoon elerhetook
  // const gomb = new android.widget.Button(context);
  // gomb.setText("Kattints ram");
  // gomb.setOnClickListener(new android.view.View.OnClickListener({
  //   onClick: function() {
  //     console.log("Megnyomtak a gombot!");
  //   }
  // }));

  // ...belulrol ez tortenik:
  // 1. A "new android.widget.Button()" JavaScript hivas a V8-on keresztul
  //    eljut a NativeScript runtime-hoz
  // 2. A runtime megkeresi a metadata-ban az android.widget.Button osztalyt
  // 3. Letrehoz egy valos Java Button objektumot a JVM-ben (Java Virtual Machine)
  // 4. Visszaad egy JavaScript proxy-t, ami erre a Java objektumra mutat
  // 5. A setText() hivas a proxy-n keresztul a Java setText()-et hivja

  console.log("A UI elem kozvetlenul a nativ platformon jon letre");
}


/* --- 3. A rendering pipeline ---

  Amikor a NativeScript alkalmazasod megjelenik a kepernyon, a kovetkezo
  tortenik:

  1. A JavaScript kod (vagy az XML layout) leirja, milyen UI elemeket
     szeretnel latni es hogyan rendezodjenek el.

  2. A NativeScript layout rendszere kiszamolja, mekkora es hol legyen
     minden elem. Ez hasonlo a bongeszoek CSS layout motorjahoz, de
     sokkal egyszerubb (es gyorsabb).

  3. A kiszamolt poziciok es meretek alapjan a rendszer letrehozza
     (vagy frissiti) a nativ UI elemeket.

  4. A nativ UI elemeket az operacios rendszer rendereli a kepernyore
     -- pontosan ugyanugy, ahogy egy nativ alkalmazasnal.

  Ez utolso lepes a kulcs: a renderelesert az OS felel, nem a
  NativeScript. Ezert nez ki es mozog az alkalmazas nativul.
*/


/* --- 4. A TypeScript role az architekturaban ---

  A NativeScript alkalmazasok TypeScript-ben irodnak (bar JavaScript
  is hasznalhato). A build soran a TypeScript eloszor JavaScript-re
  fordul, es ez a JavaScript kod fut a telefonon.

  A TypeScript itt ket okbol kuloonosen hasznos:

  1. Tipusbizonsag a nativ API-khoz
     A @nativescript/types csomag tartalmazza az Android es iOS
     API-k TypeScript tipusdefinicioit. Ez azt jelenti, hogy a
     fordito ellenorzi, hogy helyesen hivod-e a nativ API-kat --
     nativ fejlesztesben ritka luxus, hogy a kod meg a futtatass
     elott megmondja, ha rossz parametert adtal at.

  2. Jobb fejlesztoi elmeny
     Automata kiegeszites (IntelliSense), navigacio a forraaskodban,
     refactoring -- ezek mind sokkal jobban muukodnek TypeScript-tel,
     mint sima JavaScript-tel.
*/

// Pelda: tipusos nativ API hivas
// A @nativescript/types-nak koszonhetoen ez tipusellenorzott:

// @ts-ignore
// const fileManager: NSFileManager = NSFileManager.defaultManager;
// A fordito tudja, hogy a defaultManager letezik es NSFileManager-t ad vissza.
// Ha elirnad ("defaltManager"), forditasi hiba lenne.


/* --- 5. Build folyamat ---

  A NativeScript build folyamata a kovetkezo fobb lepesekbol all:

  1. TypeScript forditas -> JavaScript
  2. Webpack csomagolas (a JavaScript kodot es fuggosegeket
     egyetlen bundle-be gyuujti)
  3. Nativ projekt generaalas (Android Studio projekt vagy Xcode projekt)
  4. Nativ build (Gradle Android-on, xcodebuild iOS-en)
  5. Az eredmeny: .apk/.aab (Android) vagy .ipa (iOS)

  Fejlesztes kozben a "Hot Module Replacement" (HMR) lehetove teszi,
  hogy a kodvaltoztatasok azonnal megjelenjenek az eszkozoon vagy
  emulatoron, anelkul hogy ujra kellene epiteni az egesz alkalmazast.
*/

// Pelda a projekt mappaszerkezetre:
//
// nativescript-app/
//   src/
//     app.ts              -- az alkalmazas belepesi pontja
//     app-root.xml        -- a gyoker layout
//     main-page.ts        -- az elso oldal logikaja
//     main-page.xml       -- az elso oldal layoutja
//     main-page.css       -- az elso oldal stilusa
//   App_Resources/
//     Android/            -- Android-specifikus eroforrasok (ikonok, beallitasok)
//     iOS/                -- iOS-specifikus eroforrasok
//   node_modules/
//   package.json
//   nativescript.config.ts
//   tsconfig.json


/* --- 6. Miben kulonbozik a React Native architekturajatol? ---

  A React Native hagyomanyos architekturaja egy "bridge"-et hasznal:
  a JavaScript szal es a nativ szal kozott JSON uzeneteket kuldozgetnek
  asszinkron modon. Ez neeha teljesitmenyproblemat okozhat, kulonosen
  animacioknal es gyors scrollozasnal.

  A NativeScript-ben nincs bridge. A JavaScript motor kozvetlenul,
  szinkron modon hivja a nativ API-kat. Ez egyszerubb es kiszamithatobb
  teljesitmenyt ad.

  Megyjegyzes: a React Native ujabb architekturaja (JSI / Fabric / TurboModules)
  sokat javitott ezen, es mar szinten bridge nelkuli kommunikaciot hasznal.
  Tehat ez a kulonbseg egyre kisebb, de a NativeScript eleve igy epult fel.
*/


/* --- Osszefoglalas ---

  A NativeScript architekturaja harom pilleeren all:
  1. JavaScript motor (V8 / JSC) fut kozvetlenul a telefonon
  2. Metadata rendszer teszi elerhetove a nativ API-kat JS-bol
  3. A nativ UI elemeket az OS rendereli, nem a keretrendszer

  Nincs WebView, nincs bridge, nincs sajat renderelo motor.
  A JavaScript kod kozvetlenul a nativ platformmal kommunikal.

  A kovetkezo fajlban megnezzuk a konkret UI elemeket, amikbol
  felepheted az alkalmazasod feluuletet.
*/

export { runtimeInfo, demonstracioUILetrehozas };
