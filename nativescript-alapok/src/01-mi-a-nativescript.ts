/*
  Mi a NativeScript?

  A NativeScript egy nyilt forrasu keretrendszer, amivel JavaScript-bol
  vagy TypeScript-bol irhatsz mobilalkalmazasokat Androidra es iOS-re.
  De nem ugy, ahogy mondjuk az Ionic csinalja (ami lenyegeeben egy
  bongeszot futtat a telefonon) -- a NativeScript VALOS NATIV UI elemeket
  hasznal. Amikor a kododban irsz egy Button-t, abbol Android-on
  android.widget.Button lesz, iOS-en UIButton.

  Ez azert fontos, mert a felhasznalo nem egy weboldalat lat telefonon,
  hanem egy appot, ami pontosan ugy nez ki es ugy viselkedik, mint
  barmelyik nativul (Swift/Kotlin) fejlesztett alkalmazas.

  Ebben a fajlban attekintjuk, mi a NativeScript, miben kulonbozik
  a tobbi keretrendszertol, es mikor erdemes valasztani.
*/


/* --- A mobil keretrendszerek vilagterkepe ---

  Ha mobilalkalmazast akarsz fejleszteni, tobb utvonal kozul valaszthatsz.
  Hogy megertsd, hol all a NativeScript, erdemes attekinteni a mezoenyt:

  1. Nativ fejlesztes (Swift/Kotlin)
     Kozvetlenul az adott platform nyelven es eszkozoivel fejlesztesz.
     Elony: teljes kontroll, legjobb teljesitmeny.
     Hatrany: kulon kell fejleszteni Android-ra es iOS-re, tehat
     gyakorlatilag ketszer irod meg ugyanazt az alkalmazast.

  2. React Native (Meta/Facebook)
     JavaScript/React-et hasznalsz, es a keretrendszer nativ UI
     elemeket hoz letre. Hasonllit a NativeScript-hez abban, hogy
     valodi nativ UI-t kapsz. A fo kulonbseg: a React Native egy
     "bridge"-en keresztul kommunikal a nativ oldallal, ami neha
     teljesitmenyproblemaket okozhat (bar az ujabb architektura,
     a "New Architecture / Fabric" sokat javitott ezen).

  3. Flutter (Google)
     Dart nyelvet hasznal, es SAJAT renderelo motort hasznal (Skia/Impeller).
     Nem a platform nativ UI elemeit hasznalja, hanem mindent maga rajzol.
     Elony: pixel-pontos azonos megjelenes minden platformon.
     Hatrany: nem nativ UI elemek, tehat az app "erzes" neha kulonbozik
     attol, amit a felhasznalo megszokott az adott platformon.

  4. Ionic / Capacitor
     Webes technologiaakat hasznal (HTML, CSS, JS) es egy WebView-ban
     fut a telefonon. Lenyegeben egy bongeszot nyitsz meg teljes kepernyon.
     Elony: ha mar van webes tudasod, gyorsan tudsz appot csinalni.
     Hatrany: teljesitmeny es "nativ erzes" gyengebb, mert nem nativ UI.

  5. NativeScript
     TypeScript/JavaScript-et hasznal, es KOZVETLENUL eleri a nativ API-kat.
     Nincs bridge (szemben a React Native-val), nincs WebView (szemben
     az Ionic-kal). A JavaScript runtime (V8 Android-on, JavaScriptCore
     iOS-en) kozvetlenul hivja a platform API-jait.
*/


/* --- A NativeScript egyedi ereje: kozvetlen nativ API eleres ---

  Ez a NativeScript talaan legfontosabb tulajdonsaga. Mas keretrendszerek
  plugin-okat vagy bridge-eket hasznalnak, hogy elerjek a nativ funkciokat
  (kamera, GPS, fajlrendszer, stb.). A NativeScript-ben viszont
  KOZVETLENUL hivhatod a Java/Kotlin (Android) es Objective-C/Swift
  (iOS) API-kat TypeScript-bol.

  Ez azt jelenti, hogy ha megjelenik egy uj Android API (mondjuk egy uj
  szenzor), azonnal tudod hasznalni -- nem kell megvarnod, hogy valaki
  irjon hozza egy wrapper plugin-t.
*/

// Pelda: Android Toast megjelenites kozvetlenul TypeScript-bol
// (Ez valos NativeScript kod, ami Android-on tenylegesen mukodik)

function androidToastPelda(): void {
  // @ts-ignore -- a nativ API-k tipusai a @nativescript/types-bol jonnek
  // A "android" globalis valtozo az Android Java API-kat teszi elerhetove
  // const context = android.context;
  // const Toast = android.widget.Toast;
  // Toast.makeText(context, "Hello NativeScript-bol!", Toast.LENGTH_SHORT).show();

  // Figyeld meg: ez sima Java API hivas, csak TypeScript szintaxissal.
  // Nincs plugin, nincs bridge, nincs wrapper -- kozvetlen hozzaferes.
  console.log("Android Toast peldaa -- valos eszkozoon mukodik");
}

// Pelda: iOS UIAlertController hasznalata TypeScript-bol
function iosAlertPelda(): void {
  // @ts-ignore
  // const alert = UIAlertController.alertControllerWithTitleMessagePreferredStyle(
  //   "Figyelmeztes",
  //   "Ez egy nativ iOS alert!",
  //   UIAlertControllerStyle.Alert
  // );
  // alert.addAction(
  //   UIAlertAction.actionWithTitleStyleHandler("OK", UIAlertActionStyle.Default, null)
  // );

  console.log("iOS Alert pelda -- valos eszkozoon mukodik");
}


/* --- Osszehasonlitas: NativeScript vs React Native vs Flutter vs Ionic ---

  Nezzuk tablazatszeruen a legfontosabb szempontokat. Ez persze
  leegyszerusites, de joo kiindullopont:

  Szempont                | NativeScript | React Native | Flutter    | Ionic
  ----------------------- | ------------ | ------------ | ---------- | -------
  Nyelv                   | TS/JS        | JS/TS        | Dart       | HTML/JS
  UI                      | Nativ        | Nativ        | Sajat      | WebView
  Nativ API eleres        | Kozvetlen    | Bridge       | Plugin     | Plugin
  Teljesitmeny            | Jo           | Jo           | Nagyon jo  | Kozepes
  Tanulasi gorbe           | Kozepes      | Kozepes      | Magasabb   | Alacsony
  Kozosseg merete          | Kisebb       | Nagy         | Nagy       | Kozepes
  Webes tudassal indul?    | Igen         | Igen (React) | Nem        | Igen

  A NativeScript elonye: ha mar tudsz TypeScript-et es nem akarsz uj
  nyelvet tanulni (Dart), de szukseeged van kozvetlen nativ API hozzaferesre
  plugin-ok nelkul. Ez egy elleg specifikus, de nagyon eros pozicio.
*/


/* --- Mikor erdemes NativeScript-et valasztani? ---

  Jo valasztas, ha:
  - Mar tudsz TypeScript-et vagy JavaScript-et
  - Szukseged van kozvetl nativ API hozzaferesre (pl. speciaallis hardver)
  - Fontos a nativ megjelenes es erzet
  - Kisebb-kozepes meretu alkalmazast epitesz
  - Angular-t vagy Vue-t hasznalsz a web oldalon (van NativeScript+Angular
    es NativeScript+Vue integracio is)

  Kevesbe jo valasztas, ha:
  - Hatalmas csapattal dolgozol es fontos a nagy kozosseg/ökoszisztema
    (a React Native es Flutter kozossege nagyobb)
  - Pixel-pontos egyforma megjelenes kell minden platformon
    (erre a Flutter jobb, mert sajat renderet hasznal)
  - Mar van meglevo React kodod (akkor a React Native termeszetesebb valasztas)
  - Csak egyszeru "app burkot" akarsz egy weboldalhoz (arra az Ionic eleg)
*/


/* --- A NativeScript tortenetee roviden ---

  A NativeScript-et a Telerik (kesobb Progress Software) keszitette,
  es 2015-ben jelent meg. 2019-ben a fejleszteset atvette a kozosseg
  es az nStudio csapata. Az OpenJS Foundation is tamogatja.

  Az utobbi evekben a NativeScript fokuszaltabb es stabilabb lett.
  Nem probal mindenben versenyezni a React Native-vel vagy a Flutter-rel,
  hanem a sajat erossegeire koncentral: a kozvetlen nativ API hozzaferesre
  es a TypeScript-baraat fejlesztoi elmenyre.
*/

export { androidToastPelda, iosAlertPelda };
