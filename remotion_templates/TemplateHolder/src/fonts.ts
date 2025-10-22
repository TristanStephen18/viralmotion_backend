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


const FONT_OPTIONS = {
  weights: ["400", "700"], // load only the main weights you actually use
  subsets: ["latin"],      // usually all you need
  display: "swap",         // optional, but helps with render consistency
  ignoreTooManyRequestsWarning: true, // silence warning (optional)
};

// Load all Google Fonts used in fontOptions
export const loadAllFonts = () => {
  // Already loaded fonts
  PlayfairDisplay.loadFont(FONT_OPTIONS);
  Roboto.loadFont(FONT_OPTIONS);
  BebasNeue.loadFont(FONT_OPTIONS);
  RussoOne.loadFont(FONT_OPTIONS);
  LilitaOne.loadFont(FONT_OPTIONS);
  ChangaOne.loadFont(FONT_OPTIONS);
  ArchivoBlack.loadFont(FONT_OPTIONS);
  GravitasOne.loadFont(FONT_OPTIONS);
  Bungee.loadFont(FONT_OPTIONS);
  LuckiestGuy.loadFont(FONT_OPTIONS);
  AmaticSC.loadFont(FONT_OPTIONS);
  Satisfy.loadFont(FONT_OPTIONS);
  Pacifico.loadFont(FONT_OPTIONS);
  DancingScript.loadFont(FONT_OPTIONS);
  OleoScript.loadFont(FONT_OPTIONS);
  Silkscreen.loadFont(FONT_OPTIONS);
  KodeMono.loadFont(FONT_OPTIONS);
  Asimovian.loadFont(FONT_OPTIONS);
  Tagesschrift.loadFont(FONT_OPTIONS);
  StoryScript.loadFont(FONT_OPTIONS);
  BitcountGridDouble.loadFont(FONT_OPTIONS);

  // ✅ Newly added fonts
  RobotoMono.loadFont(FONT_OPTIONS);
  SourceCodePro.loadFont(FONT_OPTIONS);
  JetBrainsMono.loadFont(FONT_OPTIONS);
  FiraCode.loadFont(FONT_OPTIONS);
  IBMPlexMono.loadFont(FONT_OPTIONS);

  Inter.loadFont(FONT_OPTIONS);
  Poppins.loadFont(FONT_OPTIONS);
  Montserrat.loadFont(FONT_OPTIONS);
  Raleway.loadFont(FONT_OPTIONS);

  Merriweather.loadFont(FONT_OPTIONS);

  Anton.loadFont(FONT_OPTIONS);
  Oswald.loadFont(FONT_OPTIONS);
  AbrilFatface.loadFont(FONT_OPTIONS);

  SpaceMono.loadFont(FONT_OPTIONS);
  CourierPrime.loadFont(FONT_OPTIONS);
  UbuntuMono.loadFont(FONT_OPTIONS);
  Inconsolata.loadFont(FONT_OPTIONS);
  AnonymousPro.loadFont(FONT_OPTIONS);
};
