import React from "react";
import {
  AbsoluteFill,
  spring,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  Easing,
  getInputProps,
} from "remotion";

/** === Types === */
export type CardFace = { label: string; value: string; color: string };
export type CardData = { front: CardFace; back: CardFace };

export type KpiFlipCardsProps = {
  // Background
  backgroundImage?: string;

  // Title
  title?: string;
  titleFontSize?: number;
  titleFontColor?: string;
  titleFontFamily?: string;

  // Subtitle
  subtitle?: string;
  subtitleFontSize?: number;
  subtitleFontColor?: string;
  subtitleFontFamily?: string;

  // Cards
  cardsData: CardData[];
  cardWidth?: number;
  cardHeight?: number;
  cardBorderRadius?: number;
  cardBorderColor?: string;
  cardLabelColor?: string;
  cardLabelFontSize?: number;
  cardContentFontFamily?: string;

  // Layout
  cardGrid?: { rows: number; cols: number };

  // Animation
  delayStart?: number;
  delayStep?: number;
  cardColorFront?: string;
  cardColorBack: string;
  valueFontSize?: number;
};

type FlipCardProps = {
  data: CardData;
  delay: number;
  frame: number;
  fps: number;
  size: { width: number; height: number };
  borderRadius: number;
  borderColor: string;
  labelColor: string;
  labelFontSize: number;
  contentFontFamily: string;
  valueFontSize: number;
  cardColorBack: string;
  cardColorFront: string;
};

const FlipCard: React.FC<FlipCardProps> = ({
  data,
  delay,
  frame,
  fps,
  size,
  borderRadius,
  borderColor,
  labelColor,
  labelFontSize,
  contentFontFamily,
  cardColorBack,
  cardColorFront,
  valueFontSize
}) => {
  const startFrame = Math.round(delay * fps);
  const localFrame = Math.max(0, frame - startFrame);

  const raw = spring({
    frame: localFrame,
    fps,
    config: { damping: 22, stiffness: 120, mass: 1.2 },
  });

  const eased = interpolate(raw, [0, 1], [0, 1], {
    easing: Easing.inOut(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const rotateYDeg = interpolate(eased, [0, 1], [0, 180], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const scale = interpolate(eased, [0, 0.5, 1], [1, 1.06, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const showBack = rotateYDeg > 90;

  return (
    <div
      style={{
        width: size.width,
        height: size.height,
        perspective: "1200px",
        margin: "0 auto",
      }}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          position: "relative",
          transformStyle: "preserve-3d",
          transform: `translateZ(0) scale(${scale}) rotateY(${rotateYDeg}deg)`,
          willChange: "transform",
        }}
      >
        {/* Front */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            backgroundColor: cardColorFront,
            border: `4px solid ${borderColor}`,
            borderRadius,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            boxShadow: "0 14px 48px rgba(0, 0, 0, 0.18)",
            opacity: showBack ? 0 : 1,
            padding: 16,
          }}
        >
          <div
            style={{
              fontSize: labelFontSize,
              fontWeight: 700,
              color: labelColor,
              marginBottom: 12,
              fontFamily: contentFontFamily,
              textAlign: "center",
            }}
          >
            {data.front.label}
          </div>
          <div
            style={{
              fontSize: valueFontSize,
              fontWeight: 900,
              color: data.front.color,
              fontFamily: contentFontFamily,
              textAlign: "center",
            }}
          >
            {data.front.value}
          </div>
        </div>

        {/* Back */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            backgroundColor: cardColorBack,
            border: `4px solid ${borderColor}`,
            borderRadius,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            boxShadow: "0 14px 48px rgba(0, 0, 0, 0.18)",
            transform: "rotateY(180deg)",
            opacity: showBack ? 1 : 0,
            padding: 16,
          }}
        >
          <div
            style={{
              fontSize: labelFontSize,
              fontWeight: 700,
              color: labelColor,
              marginBottom: 12,
              fontFamily: contentFontFamily,
              textAlign: "center",
            }}
          >
            {data.back.label}
          </div>
          <div
            style={{
              fontSize: valueFontSize,
              fontWeight: 900,
              color: data.back.color,
              fontFamily: contentFontFamily,
              textAlign: "center",
            }}
          >
            {data.back.value}
          </div>
        </div>
      </div>
    </div>
  );
};

const KpiFlipCards: React.FC<KpiFlipCardsProps> = (props) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const cliProps = getInputProps<Partial<KpiFlipCardsProps>>() ?? {};
  const {
    backgroundImage = "https://picsum.photos/1080/1920",
    title = "Performance\nDashboard",
    titleFontSize = 96,
    titleFontColor = "#FFFFFF",
    titleFontFamily = "Inter, system-ui, sans-serif",
    subtitle = "Real-time Analytics",
    subtitleFontSize = 36,
    subtitleFontColor = "#E5E7EB",
    subtitleFontFamily = "Inter, system-ui, sans-serif",
    cardsData = [],
    cardWidth = 360,
    cardHeight = 220,
    cardBorderRadius = 28,
    cardBorderColor = "#000000",
    cardLabelColor = "#6B7280",
    cardLabelFontSize = 28,
    cardContentFontFamily = "Inter, system-ui, sans-serif",
    cardGrid = { rows: 2, cols: 2 },
    delayStart = 0.5,
    delayStep = 1,
    cardColorBack = "white",
    cardColorFront = "white",
    valueFontSize = 46
  } = { ...props, ...cliProps };
  const fadeInDuration = 0.8;
  const pageFadeIn = interpolate(frame, [0, fps * fadeInDuration], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill>
      {/* Background image */}
      <AbsoluteFill
        style={{
          backgroundImage: `url(${backgroundImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />

      <AbsoluteFill
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          padding: "48px 24px",
          opacity: pageFadeIn,
        }}
      >
        {/* Title */}
        <div
          style={{
            fontSize: titleFontSize,
            fontWeight: 900,
            color: titleFontColor,
            fontFamily: titleFontFamily,
            marginBottom: 84,
            textAlign: "center",
            textShadow: "0 6px 18px rgba(0, 0, 0, 0.35)",
            whiteSpace: "pre-line",
          }}
        >
          {title}
        </div>

        {/* Cards grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${cardGrid.cols}, 1fr)`,
            gridTemplateRows: `repeat(${cardGrid.rows}, auto)`,
            gap: 32,
            justifyContent: "center",
            alignItems: "center",
            maxWidth: 1080,
          }}
        >
          {cardsData.map((data, index) => (
            <FlipCard
              key={`${data.front.label}-${index}`}
              data={data}
              delay={delayStart + index * delayStep}
              frame={frame}
              fps={fps}
              size={{ width: cardWidth, height: cardHeight }}
              borderRadius={cardBorderRadius}
              borderColor={cardBorderColor}
              labelColor={cardLabelColor}
              labelFontSize={cardLabelFontSize}
              contentFontFamily={cardContentFontFamily}
              cardColorBack={cardColorBack}
              cardColorFront={cardColorFront}
              valueFontSize={valueFontSize}
            />
          ))}
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: subtitleFontSize,
            fontWeight: 700,
            color: subtitleFontColor,
            marginTop: 72,
            textAlign: "center",
            fontFamily: subtitleFontFamily,
          }}
        >
          {subtitle}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export default KpiFlipCards;
