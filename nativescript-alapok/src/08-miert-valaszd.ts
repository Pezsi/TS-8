/*
  Miert valaszd a NativeScript-et -- es mikor ne?

  Ebben az utolso fajlban osszefoglaljuk, amit az elozo fejezetekben
  megismertunk, es gyakorlati szemmel nezzuk meg: milyen projektekhez
  a legjobb valasztas a NativeScript, es mikor erdemes inkabb mast
  hasznalni?

  Fontos: nincs tokeletes keretrendszer. Mindegyiknek vannak erossegeei
  es gyengesegei. A jo donteshez ismerni kell a sajat projekted igenyeit
  es a rendelkezesre allo eszkozoket.
*/


/* --- 1. A NativeScript erossegeei --- */

/*
  Kozvetlen nativ API eleres

  Ez a NativeScript legunikalissabb kepessege. Mas keretrendszerekneel
  plugin-t kell irni vagy talalni, ha egy nativ funkciot szeretnel
  hasznalni. A NativeScript-ben kozvetlenul, TypeScript-bol hivhatod
  az Android es iOS API-kat.

  Ez kulonosen hasznos, ha:
  - Egyedi hardver-integracio kell (specialis szenzor, BLE eszkoz)
  - Egy uj OS funkclot azonnal szeretnel hasznalni
  - Ninccs plugin az adott nativ kepesseghez
  - Vaalllalati alkalmazast epitesz sajatos integraacios igenyekkel
*/


/*
  TypeScript tamogatas

  A NativeScript kezdettol fogva tamogatja a TypeScript-et, es az
  okoszisztema nagy resze TypeScript-ben irhatsz. A @nativescript/types
  csomag az Android es iOS API-k tipusdefinicioit tartalmazza, ami
  azt jelenti, hogy a nativ API hivaasoknaal is kapsz IntelliSense-t
  es forditasi ido ellenorzest.

  Ez sokat segit a hibak korai felismereseben, kulonosen ha a nativ
  API-kat kozvetlenul hasznalod.
*/


/*
  Valodi nativ UI

  A NativeScript a platform sajat UI elemeit hasznaalja. Az alkalmazasod
  pontosan ugy nez ki es ugy viselkedik, mint egy nativ alkalmazas,
  mert AZ IS. Nincs WebView, nincs sajat renderelo motor -- az OS
  rendereli a feluletet.

  Ez azt jelenti, hogy:
  - A felhasznalok szamara issmeros lesz a kinezet es a viselkedes
  - Az akadaalymentesseg (accessibility) a platformehoz igazodik
  - A rendszer tema (sotet mod, betumeret) automatikusan mukodik
*/


/*
  Webes framework integraciok

  Ha mar hasznalsz Angular-t vagy Vue-t webes projektjeeidben, a
  NativeScript-nek van hivatalos integracioja mindkettovel:
  - NativeScript + Angular
  - NativeScript + Vue

  Ez lehetove teszi, hogy a meglevo tudaasodra epits, es akaar
  kozos kodot (szolgaltatasok, modellek, uzleti logika) osszhatsz
  meg a webes es a mobil alkalmazasod kozott.
*/


/* --- 2. A NativeScript gyengessegei --- */

/*
  Kisebb kozosseg

  Osszinteen kell lenni: a NativeScript kozossege jelentosen kisebb,
  mint a React Native-e vagy a Flutter-e. Ez azt jelenti, hogy:
  - Kevesebb Stack Overflow valasz
  - Kevesebb tutorial es blog poszt
  - Kevesebb kesz plugin es konyvtar
  - Ha elakadsz, neheezebb segitseget talalni

  Ez nem feltetlenul baj, ha a projekted jool illeszkedik a NativeScript
  erossegeeihez, de erdemes szamolni vele.
*/


/*
  Tanulasi gorbe a nativ API-khoz

  Igen, kozvetlenul hivhatod az Android es iOS API-kat. De ehhez
  ismerni kell azokat az API-kat. Ha soha nem fejlesztettel nativul,
  az Android SDK es az iOS SDK dokumentaciojaban kell keresgeslned,
  es meg kell ertened, hogyan kepezodnek le a TypeScript szintaxisra.

  Ez extrea tanulasi energia, amit mas keretrendszerekneel a plugin-ok
  absztralnak el.
*/


/*
  Fejlesztoi eszkozok

  A NativeScript fejlesztoi eszkozei jo-k, de nem annyira kiforrottak,
  mint a React Native-e (Expo, Flipper) vagy a Flutter-e (DevTools,
  Hot Reload). A hot module replacement mukodik, de neha ujrainditast
  igenyel.
*/


/* --- 3. Valoos use case-ek --- */

/*
  Mikor a NativeScript a legjobb valasztas:

  1. Vallalati alkalmazasok sajatos nativ integraaciokkal
     Peldaul: egy raktarkezeloi app, ami specialis vonalkod-olvasooval
     kommunikal. A NativeScript-tel kozvetlenul hivhatod az eszkoz
     SDK-jat, nem kell plugin-t irni vagy varni.

  2. Angular vagy Vue csapat mobil projektje
     Ha a csapatod mar Angular-t vagy Vue-t hasznal, a NativeScript
     termeszetes valasztas, mert issmeros a fejlesztesi modell.

  3. Olyan alkalmazas, ami "kozel van" a hardverhez
     IoT eszkozok kezelese, BLE kommunikacio, szenzor-intenziv
     alkalmazasok -- ahol a kozvetlen nativ API eleres elonyt jelent.

  4. Gyors prototipus natiiiv kinezeettel
     Ha fontos, hogy az alkalmazas nativul nezzen ki es viselkedjen,
     de nincs ido/budget kulon iOS es Android csapatra.
*/

/*
  Mikor valassz mast:

  1. Ha a kozossseg merete fontos neked -> React Native vagy Flutter
  2. Ha pixel-pontos azonos kinezet kell minden platformon -> Flutter
  3. Ha a csapatod React-et hasznal -> React Native
  4. Ha egyszeryu app kell gyorsan, es a natiiiv kinezet nem fontos -> Ionic
  5. Ha a teljesitmeny a legfontosabb szempont -> Nativ (Swift/Kotlin)
     vagy Flutter
*/


/* --- 4. Az okoszisztema allapota --- */

/*
  A NativeScript okoszisztemaja kisebb, de aktiv. A legfontosabb
  kozossegi pontok:

  - GitHub: https://github.com/NativeScript/NativeScript
  - Dokumentacio: https://docs.nativescript.org
  - Plugin-ok: https://market.nativescript.org
  - Discord kozosseg: aktiv, segitokesz

  A NativeScript 8.x (jelenlegi fo verzio) stabil, jol mukodik,
  es a kozosseg folyamatosan fejleszti. Nem hal ki -- de nem is
  a legfelkapottabb keretrendszer. Ez mind attol fugg, mit kereseel.
*/


/* --- 5. Gyakorlati tanacs a kezdeeshez --- */

/*
  Ha ugy dontessz, hogy kiprobaalod a NativeScript-et, itt van
  egy ajanlott menetrend:

  1. Telepitsd a NativeScript CLI-t: npm install -g @nativescript/cli
  2. Hozz letre egy uj projektet: ns create myapp --ts
     (A --ts flag TypeScript projektet hoz letre)
  3. Probaald ki emulatoron: ns run android / ns run ios
  4. Nezd at a NativeScript Playground-ot online:
     https://play.nativescript.org
  5. Olvasd el a hivatalos "Getting Started" tutorialt a docs-on

  A legfontosabb: ne probalj meg mindent egyszerre megtanulni.
  Kezdd a layoutokkal es az egyszeru UI elemekkel, utana lepj tovabb
  a navigaaciora, majd a nativ API hozzaferesre.
*/


/* --- Zaro gondolatok ---

  A NativeScript egy eroos, alulertekelt eszkoz a mobilfejlesztes
  vilagaaban. Nem mindenkinek valo, es nem minden projektre a legjobb
  valasztas. De ha TypeScript-et hasznalsz, szukseged van kozvetlen
  nativ API hozzaferesre, es fontos neked a nativ felhasznaloi elmeny,
  akkor erdemes komolyaan megfontolanod.

  A keretrendszer-valasztas mindig kompromisszum. A NativeScript
  kompromisszuma: kisebb kozosseg es kevesebb kesz plugin, cserebe
  kozvetlen, korlatlan hozzaferes a platform ossszes kepesseegehez.

  Es egy utolso gondolat: a legjobb keretrendszer az, amivel a csapatod
  produktiv tud lenni. Nincs objektiven "legjobb" megoldas -- csak
  a te projektedhez legjobban illo.
*/

export {};
