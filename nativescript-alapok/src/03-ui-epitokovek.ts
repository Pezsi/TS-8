/*
  UI epitokovek -- az alkalmazas feluleteenek epitoelemei

  A NativeScript egy keszlet UI komponenst biztosit, amikbol felepltheted
  a mobilalkalmazasod feluuletet. Ezek a komponensek a nativ platform
  megfelelo UI elemeire kepezodnek le: Android-on Android View-kra,
  iOS-en UIView-kra.

  A NativeScript-ben az UI-t keetfelekeppen definiaalhatod:
  - XML layout fajlokkal (deklarativ, hasonlit a HTML-hez)
  - TypeScript kodbol (imperrativ, koodbol epitesz fel mindent)

  A gyakorlatban altalaban az XML-t hasznaljak a layout-hoz, a TypeScript-et
  pedig a logikaahoz. De mindket megkozelites ekvivalens -- barmelyikkel
  mindent meg tudsz csinalni.
*/

import {
  Page, StackLayout, GridLayout, Label, Button,
  TextField, ListView, Image, ScrollView, ItemEventData
} from "@nativescript/core";


/* --- 1. Layout rendszer ---

  A NativeScript layout rendszere donti el, hol es mekkoran jelennek meg
  az elemek a kepernyon. Harom fo layout tipus van:

  - StackLayout: egymaa alaa (vagy melle) rakja az elemeket
  - GridLayout: racsban rendezi az elemeket (sorok es oszlopok)
  - FlexboxLayout: a webes flexbox-hoz hasonloan mukodik
  - AbsoluteLayout: fix pixelpozicioval helyezi el az elemeket
  - WrapLayout: sorba rakja, es ha nem fer el, uj sorba tordeli

  A leggyakrabban hasznalt a StackLayout (egyszeru lista-szeru elrendezesekhez)
  es a GridLayout (osszetettebb layoutokhoz).
*/

// StackLayout -- a legegyszerubb layout
// Az XML-ben igy nez ki:
//
// <StackLayout orientation="vertical">
//   <Label text="Elso sor" />
//   <Label text="Masodik sor" />
//   <Label text="Harmadik sor" />
// </StackLayout>

// Ugyanez TypeScript-bol:
function stackLayoutPelda(): StackLayout {
  const layout = new StackLayout();
  layout.orientation = "vertical"; // "vertical" (alapertelmezett) vagy "horizontal"

  const cimke1 = new Label();
  cimke1.text = "Elso sor";

  const cimke2 = new Label();
  cimke2.text = "Masodik sor";

  const cimke3 = new Label();
  cimke3.text = "Harmadik sor";

  layout.addChild(cimke1);
  layout.addChild(cimke2);
  layout.addChild(cimke3);

  return layout;
}

// GridLayout -- racs alapu elrendezes
// Ez lenyegeeben egy tablazat: megadod a sorok es oszlopok szamat
// es mereteet, es az elemeket a megfelelo cellaba helyezed.
//
// XML-ben:
// <GridLayout rows="auto, *, auto" columns="*, *">
//   <Label text="Fejlec" row="0" col="0" colSpan="2" />
//   <Label text="Tartalom" row="1" col="0" colSpan="2" />
//   <Button text="Megse" row="2" col="0" />
//   <Button text="OK" row="2" col="1" />
// </GridLayout>
//
// A sorok/oszlopok meretelese:
// - "auto": akkora, amekkora a tartalom
// - "*": kitolti a maradek helyet (tobb "*" eseten egyenlo aranyban osztja el)
// - "100": fix 100 pixel (device-independent pixel)
// - "2*": dupla aranyban kapja a helyet a sima "*"-hoz kepest

function gridLayoutPelda(): GridLayout {
  const grid = new GridLayout();
  grid.addRow("auto");    // fejlec sor -- a tartalom merete hatarozza meg
  grid.addRow("*");       // tartalom -- kitolti a maradek helyet
  grid.addRow("auto");    // lab -- a tartalom merete hatarozza meg
  grid.addColumn("*");    // bal oszlop
  grid.addColumn("*");    // jobb oszlop

  const fejlec = new Label();
  fejlec.text = "Az alkalmazas fejlece";
  GridLayout.setRow(fejlec, 0);
  GridLayout.setColumn(fejlec, 0);
  GridLayout.setColumnSpan(fejlec, 2); // Mindket oszlopot elfoglalja

  const tartalom = new Label();
  tartalom.text = "Itt van a fo tartalom";
  GridLayout.setRow(tartalom, 1);
  GridLayout.setColumn(tartalom, 0);
  GridLayout.setColumnSpan(tartalom, 2);

  const megseGomb = new Button();
  megseGomb.text = "Megse";
  GridLayout.setRow(megseGomb, 2);
  GridLayout.setColumn(megseGomb, 0);

  const okGomb = new Button();
  okGomb.text = "OK";
  GridLayout.setRow(okGomb, 2);
  GridLayout.setColumn(okGomb, 1);

  grid.addChild(fejlec);
  grid.addChild(tartalom);
  grid.addChild(megseGomb);
  grid.addChild(okGomb);

  return grid;
}


/* --- 2. Alapveto UI elemek --- */

// Label -- szoveg megjelenitese (nem szerkesztheto)
// XML: <Label text="Udvozollek!" class="cim" />
function labelPelda(): Label {
  const cimke = new Label();
  cimke.text = "Udvozollek az alkalmazasban!";
  cimke.textWrap = true; // Sortores engedelyezese (alapbol nem torik)
  cimke.className = "cim"; // CSS osztalyy
  return cimke;
}

// Button -- gomb, amire a felhasznalo kattinthat
// XML: <Button text="Kattints" tap="onTap" />
function buttonPelda(): Button {
  const gomb = new Button();
  gomb.text = "Kattints ram!";
  gomb.on("tap", () => {
    console.log("A felhasznalo megnyomta a gombot");
    gomb.text = "Koszonom!";
  });
  return gomb;
}

// TextField -- egysoros szovegbeviteli mezo
// XML: <TextField hint="Ird be a neved" text="{{ nev }}" />
function textFieldPelda(): TextField {
  const mezo = new TextField();
  mezo.hint = "Ird be a neved..."; // Placeholder szoveg
  mezo.secure = false;               // true eseten jelszo mezo (csillagok)
  mezo.keyboardType = "email";       // Billentyuzet tipus: email, number, phone, url
  mezo.returnKeyType = "done";       // Enter gomb szovege
  mezo.on("textChange", (args) => {
    console.log("Uj szoveg:", mezo.text);
  });
  return mezo;
}

// Image -- kep megjelenitese
// XML: <Image src="~/images/logo.png" stretch="aspectFit" />
function imagePelda(): Image {
  const kep = new Image();
  // Kepek forrasai:
  // - Helyi fajl: "~/images/logo.png" (a ~ a src mappara mutat)
  // - URL: "https://pelda.hu/kep.png"
  // - Eroforras: "res://icon" (platform-specifikus eroforras)
  kep.src = "~/images/logo.png";
  kep.stretch = "aspectFit"; // aspectFit, aspectFill, fill, none
  kep.width = 200;
  kep.height = 200;
  return kep;
}


/* --- 3. ScrollView es ListView ---

  Ha a tartalom nagyobb, mint a kepernyo, scrollozhatova kell tenni.
  Ket fo lehetoseged van:

  - ScrollView: barrmilyen tartalmat scrollozhatova tesz.
    Egyszeru, de ha sok elem van, mindegyiket letrehozza a memoriaban.

  - ListView: virtualizalt lista. Csak a kepernyon lathato elemeket
    hozza letre, a tobbit "ujrahasznositja" scrollozaskor.
    Nagy listak eseten (100+ elem) mindig ListView-t hasznalj!
*/

// ScrollView pelda
// XML:
// <ScrollView>
//   <StackLayout>
//     <Label text="Sok-sok tartalom..." />
//     <!-- ... -->
//   </StackLayout>
// </ScrollView>

function scrollViewPelda(): ScrollView {
  const scroll = new ScrollView();
  const tartalom = new StackLayout();

  for (let i = 0; i < 50; i++) {
    const cimke = new Label();
    cimke.text = `Ez a ${i + 1}. elem a listaban`;
    tartalom.addChild(cimke);
  }

  scroll.content = tartalom;
  return scroll;
}

// ListView pelda -- virtualizalt, hatekony lista
// XML:
// <ListView items="{{ elemek }}" itemLoading="onItemLoading">
//   <ListView.itemTemplate>
//     <Label text="{{ nev }}" />
//   </ListView.itemTemplate>
// </ListView>

function listViewPelda(): ListView {
  const lista = new ListView();

  const adatok = [
    { nev: "Alma", ar: 300 },
    { nev: "Korte", ar: 400 },
    { nev: "Szilva", ar: 250 },
    { nev: "Barack", ar: 500 },
  ];

  lista.items = adatok;
  lista.on("itemLoading", (args: ItemEventData) => {
    // Ez a fuggveny minden lathato elemre meghivodik
    // Az args.index megmondja, hanyadik elemrol van szo
    console.log(`Elem betoltese: ${adatok[args.index].nev}`);
  });

  lista.on("itemTap", (args: ItemEventData) => {
    const kivalasztott = adatok[args.index];
    console.log(`Kivalasztva: ${kivalasztott.nev} (${kivalasztott.ar} Ft)`);
  });

  return lista;
}


/* --- Osszefoglalas ---

  A NativeScript UI epitokovei:
  - Layout-ok (StackLayout, GridLayout) hatarozzak meg az elrendezest
  - Alapveto elemek (Label, Button, TextField, Image) alkotjak a feluuletet
  - ScrollView egyszeruu gorgetheto tartalom, ListView virtualizalt lista
  - Minden elem XML-bol es TypeScript-bol is letrehozhatoo
  - Minden NativeScript UI elem a platform nativ parjara keeipezodik le

  A kovetkezo fajlban megnezzuk, hogyan navigalunk az oldalak kozott.
*/

export {
  stackLayoutPelda,
  gridLayoutPelda,
  labelPelda,
  buttonPelda,
  textFieldPelda,
  listViewPelda,
};
