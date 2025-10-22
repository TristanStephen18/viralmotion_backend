// font-loader.ts
import * as PlayfairDisplay from "@remotion/google-fonts/PlayfairDisplay";
import * as Roboto from "@remotion/google-fonts/Roboto";
import * as BebasNeue from "@remotion/google-fonts/BebasNeue";
import * as RussoOne from "@remotion/google-fonts/RussoOne";
import * as LilitaOne from "@remotion/google-fonts/LilitaOne";
import * as ChangaOne from "@remotion/google-fonts/ChangaOne";
import * as ArchivoBlack from "@remotion/google-fonts/ArchivoBlack";
import * as GravitasOne from "@remotion/google-fonts/GravitasOne";
import * as Bungee from "@remotion/google-fonts/Bungee";
import * as LuckiestGuy from "@remotion/google-fonts/LuckiestGuy";
import * as AmaticSC from "@remotion/google-fonts/AmaticSC";
import * as Satisfy from "@remotion/google-fonts/Satisfy";
import * as Pacifico from "@remotion/google-fonts/Pacifico";
import * as DancingScript from "@remotion/google-fonts/DancingScript";
import * as OleoScript from "@remotion/google-fonts/OleoScript";
import * as Silkscreen from "@remotion/google-fonts/Silkscreen";
import * as KodeMono from "@remotion/google-fonts/KodeMono";
import * as Asimovian from "@remotion/google-fonts/Asimovian";
import * as Tagesschrift from "@remotion/google-fonts/Tagesschrift";
import * as StoryScript from "@remotion/google-fonts/StoryScript";
import * as BitcountGridDouble from "@remotion/google-fonts/BitcountGridDouble";
// font-loader.ts
import * as RobotoMono from "@remotion/google-fonts/RobotoMono";
import * as SourceCodePro from "@remotion/google-fonts/SourceCodePro";
import * as JetBrainsMono from "@remotion/google-fonts/JetBrainsMono";
import * as FiraCode from "@remotion/google-fonts/FiraCode";
import * as IBMPlexMono from "@remotion/google-fonts/IBMPlexMono";

import * as Inter from "@remotion/google-fonts/Inter";
import * as Poppins from "@remotion/google-fonts/Poppins";
import * as Montserrat from "@remotion/google-fonts/Montserrat";
import * as Raleway from "@remotion/google-fonts/Raleway";

import * as Merriweather from "@remotion/google-fonts/Merriweather";

import * as Anton from "@remotion/google-fonts/Anton";
import * as Oswald from "@remotion/google-fonts/Oswald";
import * as AbrilFatface from "@remotion/google-fonts/AbrilFatface";

import * as SpaceMono from "@remotion/google-fonts/SpaceMono";
import * as CourierPrime from "@remotion/google-fonts/CourierPrime";
import * as UbuntuMono from "@remotion/google-fonts/UbuntuMono";
import * as Inconsolata from "@remotion/google-fonts/Inconsolata";
import * as AnonymousPro from "@remotion/google-fonts/AnonymousPro";

// System fonts (Arial, Helvetica, etc.) don’t need loaders

// Load all Google Fonts used in fontOptions
export const loadAllFonts = () => {
  // Already loaded fonts
  PlayfairDisplay.loadFont();
  Roboto.loadFont();
  BebasNeue.loadFont();
  RussoOne.loadFont();
  LilitaOne.loadFont();
  ChangaOne.loadFont();
  ArchivoBlack.loadFont();
  GravitasOne.loadFont();
  Bungee.loadFont();
  LuckiestGuy.loadFont();
  AmaticSC.loadFont();
  Satisfy.loadFont();
  Pacifico.loadFont();
  DancingScript.loadFont();
  OleoScript.loadFont();
  Silkscreen.loadFont();
  KodeMono.loadFont();
  Asimovian.loadFont();
  Tagesschrift.loadFont();
  StoryScript.loadFont();
  BitcountGridDouble.loadFont();

  // ✅ Newly added fonts
  RobotoMono.loadFont();
  SourceCodePro.loadFont();
  JetBrainsMono.loadFont();
  FiraCode.loadFont();
  IBMPlexMono.loadFont();

  Inter.loadFont();
  Poppins.loadFont();
  Montserrat.loadFont();
  Raleway.loadFont();

  Merriweather.loadFont();

  Anton.loadFont();
  Oswald.loadFont();
  AbrilFatface.loadFont();

  SpaceMono.loadFont();
  CourierPrime.loadFont();
  UbuntuMono.loadFont();
  Inconsolata.loadFont();
  AnonymousPro.loadFont();
};
