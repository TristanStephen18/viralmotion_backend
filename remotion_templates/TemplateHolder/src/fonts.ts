// // font-loader.ts
// import * as PlayfairDisplay from "@remotion/google-fonts/PlayfairDisplay";
// import * as Roboto from "@remotion/google-fonts/Roboto";
// import * as BebasNeue from "@remotion/google-fonts/BebasNeue";
// import * as RussoOne from "@remotion/google-fonts/RussoOne";
// import * as LilitaOne from "@remotion/google-fonts/LilitaOne";
// import * as ChangaOne from "@remotion/google-fonts/ChangaOne";
// import * as ArchivoBlack from "@remotion/google-fonts/ArchivoBlack";
// import * as GravitasOne from "@remotion/google-fonts/GravitasOne";
// import * as Bungee from "@remotion/google-fonts/Bungee";
// import * as LuckiestGuy from "@remotion/google-fonts/LuckiestGuy";
// import * as AmaticSC from "@remotion/google-fonts/AmaticSC";
// import * as Satisfy from "@remotion/google-fonts/Satisfy";
// import * as Pacifico from "@remotion/google-fonts/Pacifico";
// import * as DancingScript from "@remotion/google-fonts/DancingScript";
// import * as OleoScript from "@remotion/google-fonts/OleoScript";
// import * as Silkscreen from "@remotion/google-fonts/Silkscreen";
// import * as KodeMono from "@remotion/google-fonts/KodeMono";
// import * as Asimovian from "@remotion/google-fonts/Asimovian";
// import * as Tagesschrift from "@remotion/google-fonts/Tagesschrift";
// import * as StoryScript from "@remotion/google-fonts/StoryScript";
// import * as BitcountGridDouble from "@remotion/google-fonts/BitcountGridDouble";
// // font-loader.ts
// import * as RobotoMono from "@remotion/google-fonts/RobotoMono";
// import * as SourceCodePro from "@remotion/google-fonts/SourceCodePro";
// import * as JetBrainsMono from "@remotion/google-fonts/JetBrainsMono";
// import * as FiraCode from "@remotion/google-fonts/FiraCode";
// import * as IBMPlexMono from "@remotion/google-fonts/IBMPlexMono";

// import * as Inter from "@remotion/google-fonts/Inter";
// import * as Poppins from "@remotion/google-fonts/Poppins";
// import * as Montserrat from "@remotion/google-fonts/Montserrat";
// import * as Raleway from "@remotion/google-fonts/Raleway";

// import * as Merriweather from "@remotion/google-fonts/Merriweather";

// import * as Anton from "@remotion/google-fonts/Anton";
// import * as Oswald from "@remotion/google-fonts/Oswald";
// import * as AbrilFatface from "@remotion/google-fonts/AbrilFatface";

// import * as SpaceMono from "@remotion/google-fonts/SpaceMono";
// import * as CourierPrime from "@remotion/google-fonts/CourierPrime";
// import * as UbuntuMono from "@remotion/google-fonts/UbuntuMono";
// import * as Inconsolata from "@remotion/google-fonts/Inconsolata";
// import * as AnonymousPro from "@remotion/google-fonts/AnonymousPro";

// const COMMON_OPTS = {
//   subsets: ["latin"],
//   display: "swap",
//   ignoreTooManyRequestsWarning: true,
//   styles: ["normal"], 
// };


// // Helper: safely load fonts and avoid crashes
// const safeLoad = (fontModule: any, options: any) => {
//   try {
//     fontModule.loadFont(options);
//   } catch (err) {
//     console.warn(`⚠️ Failed to load font: ${fontModule?.fontFamily || "unknown"}`, err);
//   }
// };

// // Load all Google Fonts used in the project
// export const loadAllFonts = () => {
//   // Serif / Display
//   PlayfairDisplay.loadFont({ ...COMMON_OPTS, weights: ["400", "700", "900"] });
//   Merriweather.loadFont({ ...COMMON_OPTS, weights: ["300", "400", "700", "900"] });
//   AbrilFatface.loadFont({ ...COMMON_OPTS, weights: ["400"] });

//   // Sans-serif
//   Roboto.loadFont({ ...COMMON_OPTS, weights: ["400", "500", "700"] });
//   Inter.loadFont({ ...COMMON_OPTS, weights: ["400", "500", "700"] });
//   Poppins.loadFont({ ...COMMON_OPTS, weights: ["400", "600", "700"] });
//   Montserrat.loadFont({ ...COMMON_OPTS, weights: ["400", "600", "700"] });
//   Raleway.loadFont({ ...COMMON_OPTS, weights: ["400", "600", "700"] });
//   Oswald.loadFont({ ...COMMON_OPTS, weights: ["400", "500", "700"] });
//   Anton.loadFont({ ...COMMON_OPTS, weights: ["400"] });

//   // Decorative / Headline
//   BebasNeue.loadFont({ ...COMMON_OPTS, weights: ["400"] });
//   RussoOne.loadFont({ ...COMMON_OPTS, weights: ["400"] });
//   LilitaOne.loadFont({ ...COMMON_OPTS, weights: ["400"] });
//   ChangaOne.loadFont({ ...COMMON_OPTS, weights: ["400", "700"] });
//   ArchivoBlack.loadFont({ ...COMMON_OPTS, weights: ["400"] });
//   GravitasOne.loadFont({ ...COMMON_OPTS, weights: ["400"] });
//   Bungee.loadFont({ ...COMMON_OPTS, weights: ["400"] });
//   LuckiestGuy.loadFont({ ...COMMON_OPTS, weights: ["400"] });
//   AmaticSC.loadFont({ ...COMMON_OPTS, weights: ["400", "700"] });
//   Satisfy.loadFont({ ...COMMON_OPTS, weights: ["400"] });
//   Pacifico.loadFont({ ...COMMON_OPTS, weights: ["400"] });
//   DancingScript.loadFont({ ...COMMON_OPTS, weights: ["400", "700"] });
//   OleoScript.loadFont({ ...COMMON_OPTS, weights: ["400", "700"] });
//   Silkscreen.loadFont({ ...COMMON_OPTS, weights: ["400", "700"] });
//   BitcountGridDouble.loadFont({ ...COMMON_OPTS, weights: ["400"] });
//   Asimovian.loadFont({ ...COMMON_OPTS, weights: ["400"] });
//   Tagesschrift.loadFont({ ...COMMON_OPTS, weights: ["400"] });
//   StoryScript.loadFont({ ...COMMON_OPTS, weights: ["400"] });

//   // Mono / Coding Fonts
//   RobotoMono.loadFont({ ...COMMON_OPTS, weights: ["400", "700"] });
//   SourceCodePro.loadFont({ ...COMMON_OPTS, weights: ["400", "700"] });
//   JetBrainsMono.loadFont({ ...COMMON_OPTS, weights: ["400", "700"] });
//   FiraCode.loadFont({ ...COMMON_OPTS, weights: ["400", "700"] });
//   IBMPlexMono.loadFont({ ...COMMON_OPTS, weights: ["400", "700"] });
//   SpaceMono.loadFont({ ...COMMON_OPTS, weights: ["400", "700"] });
//   CourierPrime.loadFont({ ...COMMON_OPTS, weights: ["400", "700"] });
//   UbuntuMono.loadFont({ ...COMMON_OPTS, weights: ["400", "700"] });
//   Inconsolata.loadFont({ ...COMMON_OPTS, weights: ["400", "700"] });
//   AnonymousPro.loadFont({ ...COMMON_OPTS, weights: ["400", "700"] });
// };

