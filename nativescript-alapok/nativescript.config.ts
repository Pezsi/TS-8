/*
  NativeScript konfiguracios fajl

  Ez a fajl a NativeScript CLI szamara tartalmaz beallitasokat.
  Megadja, hogy milyen tipusu alkalmazast epitunk, mi az alkalmazas
  egyedi azonositoja (ami az app store-okban azonositja), es milyen
  extra beallitasok kellenek a buildhez.

  A legtobb projektetben ez a fajl viszonylag egyszeru marad. A lenyeg,
  hogy az appId egyedi legyen (szokasosan fordlitott domain nev formatum),
  es a platformspecifikus beallitasokat itt tudjuk megadni, ha szukseges.
*/

import { NativeScriptConfig } from "@nativescript/core";

const config: NativeScriptConfig = {
  // Az alkalmazas egyedi azonositoja. Ez jelenik meg az app store-okban
  // es az eszkoz operacios rendszere is ezzel azonositja az alkalmazast.
  // Forditott domain nev formatum a konvencio.
  id: "hu.pelda.nativescriptalapok",

  // Az alkalmazas forraskodjanak helye
  appPath: "src",

  // A NativeScript CLI verzioja, amivel a projekt keszult.
  // Ez segit abban, hogy a CLI tudja, milyen projekt strukturat varjon.
  cli: {
    packageManager: "npm",
  },

  // Platformspecifikus beallitasok
  android: {
    // Az Android SDK minimalis verzioja
    // Az API 21 az Android 5.0 (Lollipop) -- ez mar az eszkozok 99%-at lefedi
    v8Flags: "--expose_gc",
    markingMode: "none",
  },

  ios: {
    // iOS specifikus beallitasok ide kerulnek
    // Peldaul: discardUncaughtJsExceptions: true
  },
};

export default config;
