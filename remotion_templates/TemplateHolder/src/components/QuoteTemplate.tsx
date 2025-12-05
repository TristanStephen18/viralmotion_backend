import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
  Img,
} from "remotion";
import { useCallback } from "react";

// Import all fonts
import { loadFont as loadPlayfairDisplay } from "@remotion/google-fonts/PlayfairDisplay";
import { loadFont as loadRoboto } from "@remotion/google-fonts/Roboto";
import { loadFont as loadBebasNeue } from "@remotion/google-fonts/BebasNeue";
import { loadFont as loadRussoOne } from "@remotion/google-fonts/RussoOne";
import { loadFont as loadLilitaOne } from "@remotion/google-fonts/LilitaOne";
import { loadFont as loadChangaOne } from "@remotion/google-fonts/ChangaOne";
import { loadFont as loadArchivoBlack } from "@remotion/google-fonts/ArchivoBlack";
import { loadFont as loadGravitasOne } from "@remotion/google-fonts/GravitasOne";
import { loadFont as loadBungee } from "@remotion/google-fonts/Bungee";
import { loadFont as loadLuckiestGuy } from "@remotion/google-fonts/LuckiestGuy";
import { loadFont as loadAmaticSC } from "@remotion/google-fonts/AmaticSC";
import { loadFont as loadSatisfy } from "@remotion/google-fonts/Satisfy";
import { loadFont as loadPacifico } from "@remotion/google-fonts/Pacifico";
import { loadFont as loadDancingScript } from "@remotion/google-fonts/DancingScript";
import { loadFont as loadOleoScript } from "@remotion/google-fonts/OleoScript";
import { loadFont as loadSilkscreen } from "@remotion/google-fonts/Silkscreen";
import { loadFont as loadKodeMono } from "@remotion/google-fonts/KodeMono";
import { loadFont as loadAsimovian } from "@remotion/google-fonts/Asimovian";
import { loadFont as loadTagesschrift } from "@remotion/google-fonts/Tagesschrift";
import { loadFont as loadStoryScript } from "@remotion/google-fonts/StoryScript";
import { loadFont as loadBitcountGridDouble } from "@remotion/google-fonts/BitcountGridDouble";
import { loadFont as loadRobotoMono } from "@remotion/google-fonts/RobotoMono";
import { loadFont as loadSourceCodePro } from "@remotion/google-fonts/SourceCodePro";
import { loadFont as loadJetBrainsMono } from "@remotion/google-fonts/JetBrainsMono";
import { loadFont as loadFiraCode } from "@remotion/google-fonts/FiraCode";
import { loadFont as loadIBMPlexMono } from "@remotion/google-fonts/IBMPlexMono";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { loadFont as loadPoppins } from "@remotion/google-fonts/Poppins";
import { loadFont as loadMontserrat } from "@remotion/google-fonts/Montserrat";
import { loadFont as loadRaleway } from "@remotion/google-fonts/Raleway";
import { loadFont as loadMerriweather } from "@remotion/google-fonts/Merriweather";
import { loadFont as loadAnton } from "@remotion/google-fonts/Anton";
import { loadFont as loadOswald } from "@remotion/google-fonts/Oswald";
import { loadFont as loadAbrilFatface } from "@remotion/google-fonts/AbrilFatface";
import { loadFont as loadSpaceMono } from "@remotion/google-fonts/SpaceMono";
import { loadFont as loadCourierPrime } from "@remotion/google-fonts/CourierPrime";
import { loadFont as loadUbuntuMono } from "@remotion/google-fonts/UbuntuMono";
import { loadFont as loadInconsolata } from "@remotion/google-fonts/Inconsolata";
import { loadFont as loadAnonymousPro } from "@remotion/google-fonts/AnonymousPro";

// Load all fonts
const { fontFamily: playfairDisplay } = loadPlayfairDisplay();
const { fontFamily: roboto } = loadRoboto();
const { fontFamily: bebasNeue } = loadBebasNeue();
const { fontFamily: russoOne } = loadRussoOne();
const { fontFamily: lilitaOne } = loadLilitaOne();
const { fontFamily: changaOne } = loadChangaOne();
const { fontFamily: archivoBlack } = loadArchivoBlack();
const { fontFamily: gravitasOne } = loadGravitasOne();
const { fontFamily: bungee } = loadBungee();
const { fontFamily: luckiestGuy } = loadLuckiestGuy();
const { fontFamily: amaticSC } = loadAmaticSC();
const { fontFamily: satisfy } = loadSatisfy();
const { fontFamily: pacifico } = loadPacifico();
const { fontFamily: dancingScript } = loadDancingScript();
const { fontFamily: oleoScript } = loadOleoScript();
const { fontFamily: silkscreen } = loadSilkscreen();
const { fontFamily: kodeMono } = loadKodeMono();
const { fontFamily: asimovian } = loadAsimovian();
const { fontFamily: tagesschrift } = loadTagesschrift();
const { fontFamily: storyScript } = loadStoryScript();
const { fontFamily: bitcountGridDouble } = loadBitcountGridDouble();
const { fontFamily: robotoMono } = loadRobotoMono();
const { fontFamily: sourceCodePro } = loadSourceCodePro();
const { fontFamily: jetBrainsMono } = loadJetBrainsMono();
const { fontFamily: firaCode } = loadFiraCode();
const { fontFamily: ibmPlexMono } = loadIBMPlexMono();
const { fontFamily: inter } = loadInter();
const { fontFamily: poppins } = loadPoppins();
const { fontFamily: montserrat } = loadMontserrat();
const { fontFamily: raleway } = loadRaleway();
const { fontFamily: merriweather } = loadMerriweather();
const { fontFamily: anton } = loadAnton();
const { fontFamily: oswald } = loadOswald();
const { fontFamily: abrilFatface } = loadAbrilFatface();
const { fontFamily: spaceMono } = loadSpaceMono();
const { fontFamily: courierPrime } = loadCourierPrime();
const { fontFamily: ubuntuMono } = loadUbuntuMono();
const { fontFamily: inconsolata } = loadInconsolata();
const { fontFamily: anonymousPro } = loadAnonymousPro();

// Map font names to loaded fontFamily values
const fontMap: Record<string, string> = {
  "Playfair Display": playfairDisplay,
  Roboto: roboto,
  "Bebas Neue": bebasNeue,
  "Russo One": russoOne,
  "Lilita One": lilitaOne,
  "Changa One": changaOne,
  "Archivo Black": archivoBlack,
  "Gravitas One": gravitasOne,
  Bungee: bungee,
  "Luckiest Guy": luckiestGuy,
  "Amatic SC": amaticSC,
  Satisfy: satisfy,
  Pacifico: pacifico,
  "Dancing Script": dancingScript,
  "Oleo Script": oleoScript,
  Silkscreen: silkscreen,
  "Kode Mono": kodeMono,
  Asimovian: asimovian,
  Tagesschrift: tagesschrift,
  "Story Script": storyScript,
  "Bitcount Grid Double": bitcountGridDouble,
  "Roboto Mono": robotoMono,
  "Source Code Pro": sourceCodePro,
  "JetBrains Mono": jetBrainsMono,
  "Fira Code": firaCode,
  "IBM Plex Mono": ibmPlexMono,
  Inter: inter,
  Poppins: poppins,
  Montserrat: montserrat,
  Raleway: raleway,
  Merriweather: merriweather,
  Anton: anton,
  Oswald: oswald,
  "Abril Fatface": abrilFatface,
  "Space Mono": spaceMono,
  "Courier Prime": courierPrime,
  "Ubuntu Mono": ubuntuMono,
  Inconsolata: inconsolata,
  "Anonymous Pro": anonymousPro,
};

export const QuoteComposition: React.FC<{
  quote: string;
  author: string;
  backgroundImage: string;
  fontFamily?: string;
  fontSize?: number;
  fontColor?: string;
}> = ({
  quote,
  author,
  backgroundImage,
  fontFamily = "Inter",
  fontSize = 1,
  fontColor = "white",
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const props = {
    quote,
    author,
    backgroundImage,
    fontColor,
    fontFamily,
    fontSize,
  };

  console.log("Received props : ", props);

  // Get the actual font family from the map, or fallback to the provided string
  const resolvedFontFamily = fontMap[fontFamily] || fontFamily;

  // Animation parameters
  const quoteMarkScale = spring({
    frame: frame * 0.7,
    fps,
    config: { damping: 15, stiffness: 120 },
    durationInFrames: 45,
  });

  const quoteMarkOpacity = interpolate(frame, [0, 30], [0, 1], {
    extrapolateRight: "clamp",
  });

  const bgOpacity = interpolate(frame, [30, 90], [0, 0.7], {
    extrapolateRight: "clamp",
  });

  const textPush = spring({
    frame: frame - 30,
    fps,
    config: { damping: 15, stiffness: 50 },
    durationInFrames: 90,
  });

  const wordAppear = useCallback(
    (index: number) => {
      return interpolate(frame - 45 - index * 7, [0, 45], [0, 1], {
        extrapolateRight: "clamp",
      });
    },
    [frame],
  );

  const authorAppear = spring({
    frame: frame - 45 - quote.split(" ").length * 7 - 15,
    fps,
    config: { damping: 15, stiffness: 80 },
    durationInFrames: 45,
  });

  const words = quote.split(" ");

  // Scale fonts relative to height with custom size multiplier
  const baseFontSize = height * 0.05 * fontSize;
  const quoteMarkFontSize = height * 0.1 * fontSize;
  const authorFontSize = baseFontSize * 0.75;

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      {/* Background */}
      <AbsoluteFill style={{ opacity: bgOpacity }}>
        <Img
          src={backgroundImage}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            filter: "brightness(0.6)",
          }}
        />
      </AbsoluteFill>

      {/* Quotation mark */}
      <div
        style={{
          position: "absolute",
          fontSize: quoteMarkFontSize,
          fontFamily: resolvedFontFamily,
          color: fontColor,
          fontStyle: "italic",
          opacity: quoteMarkOpacity,
          transform: `scale(${quoteMarkScale})`,
          top: height * 0.12,
          left: width * 0.1,
          lineHeight: 0.8,
          zIndex: 1,
        }}
      >
        "
      </div>

      {/* Main quote text */}
      <div
        style={{
          position: "absolute",
          fontFamily: resolvedFontFamily,
          color: fontColor,
          fontSize: baseFontSize,
          fontWeight: 400,
          lineHeight: 1.6,
          textAlign: "center",
          zIndex: 2,
          width: "80%",
          left: "10%",
          top: height * 0.3,
          transform: `translateY(${interpolate(textPush, [0, 1], [50, 0])}px)`,
        }}
      >
        {words.map((word, i) => {
          const opacity = wordAppear(i);
          return (
            <span
              key={i}
              style={{
                display: "inline-block",
                marginLeft: 12,
                opacity,
              }}
            >
              {word}
            </span>
          );
        })}
      </div>

      {/* Author */}
      <div
        style={{
          position: "absolute",
          fontFamily: resolvedFontFamily,
          color: fontColor,
          fontSize: authorFontSize,
          fontWeight: 600,
          bottom: height * 0.15,
          right: width * 0.1,
          opacity: authorAppear,
          transform: `translateY(${interpolate(
            authorAppear,
            [0, 1],
            [40, 0],
          )}px)`,
          letterSpacing: 1.5,
          textTransform: "uppercase",
          paddingTop: 15,
          textAlign: "right",
          width: "80%",
        }}
      >
        — {author}
      </div>
    </AbsoluteFill>
  );
};