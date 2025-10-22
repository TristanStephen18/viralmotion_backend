import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  Easing,
  Img,
} from "remotion";

type Slide = {
  title: string;
  subtitle?: string;
  description?: string;
};

type FactsCardVideoProps = {
  intro: Slide;
  outro: Slide;
  facts: Slide[];
  backgroundImage: string;
  fontSizeTitle: number;
  fontSizeSubtitle: number;
  fontFamilyTitle: string;
  fontFamilySubtitle: string;
  fontColorTitle: string;
  fontColorSubtitle: string;
};

export const FactsCardVideo: React.FC<FactsCardVideoProps> = ({
  intro,
  outro,
  facts,
  backgroundImage,
  fontSizeTitle,
  fontSizeSubtitle,
  fontFamilyTitle,
  fontColorTitle,
  fontColorSubtitle,
  fontFamilySubtitle
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const slides = [intro, ...facts, outro];
  const slideDuration = durationInFrames / slides.length;

  const currentIndex = Math.min(
    Math.floor(frame / slideDuration),
    slides.length - 1
  );
  const localFrame = frame % slideDuration;

  const currentSlide = slides[currentIndex];

  // Common fade
  const opacity = interpolate(
    localFrame,
    [0, fps * 0.3, slideDuration - fps * 0.5, slideDuration],
    [0, 1, 1, 0],
    { extrapolateRight: "clamp" }
  );

  // Motion: facts = slide up, intro/outro = bounce
  let translateY = 0;

  if (currentIndex === 0 || currentIndex === slides.length - 1) {
    // Intro / Outro: subtle bounce
    translateY = interpolate(
      localFrame,
      [0, fps * 0.4, fps * 0.7, fps],
      [50, -15, 5, 0],
      {
        easing: Easing.out(Easing.ease),
        extrapolateRight: "clamp",
      }
    );
  } else {
    // Facts cards: slide up
    translateY = interpolate(
      localFrame,
      [0, fps * 0.6],
      [50, 0],
      {
        easing: Easing.out(Easing.quad),
        extrapolateRight: "clamp",
      }
    );
  }

  return (
    <AbsoluteFill>
      {/* Background */}
      <Img
        src={backgroundImage}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
        }}
      />

      {/* Card */}
      <AbsoluteFill
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          padding: "60px",
        }}
      >
        <div
          style={{
            background: "rgba(255, 255, 255, 0.15)",
            borderRadius: "25px",
            padding: "60px 80px",
            textAlign: "center",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            boxShadow: "0 12px 40px rgba(0,0,0,0.4)",
            opacity,
            maxWidth: "80%",
            display: "inline-block",
            transform: `translateY(${translateY}px)`,
          }}
        >
          {/* Title */}
          <h1
            style={{
              fontSize:
                currentIndex === 0 || currentIndex === slides.length - 1
                  ? fontSizeTitle * 1.3
                  : fontSizeTitle,
              fontWeight: "bold",
              margin: 0,
              marginBottom: "20px",
              textShadow: "0 4px 20px rgba(0,0,0,0.6)",
              fontFamily: fontFamilyTitle,
              color:fontColorTitle
            }}
          >
            {currentSlide.title}
          </h1>

          {/* Subtitle/Description */}
          <p
            style={{
              fontSize:
                currentIndex === 0 || currentIndex === slides.length - 1
                  ? fontSizeSubtitle * 1.2
                  : fontSizeSubtitle,
              margin: 0,
              fontWeight: 300,
              opacity: 0.95,
              lineHeight: 1.5,
              fontFamily: fontFamilySubtitle,
              color:fontColorSubtitle
            }}
          >
            {"description" in currentSlide
              ? currentSlide.description
              : currentSlide.subtitle}
          </p>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
