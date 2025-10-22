import React, { useMemo } from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

export type BarGraphProps = {
  data: {
    name: string;
    value: number | string;
  }[];
  title: string;
  subtitle?: string;
  accent: string;
  backgroundImage: string; // image src instead of color
  titleFontColor: string;
  currency?: string;

  // New props
  titleFontSize?: number;
  subtitleFontSize?: number;
  subtitleColor?: string;
  barHeight?: number;
  barGap?: number;
  barLabelFontSize?: number;
  barValueFontSize?: number;
  fontFamily: string;
};

// ---------- Helpers ----------
const formatValue = (n: number, currency?: string) =>
  currency ? `${currency} ${n.toLocaleString()}` : n.toLocaleString();

const extractNumericValue = (value: string | number): number => {
  if (typeof value === "number") return value;
  const match = value.match(/[\d.]+/);
  return match ? parseFloat(match[0]) : 0;
};

const colors = [
  "#16A34A",
  "#F97316",
  "#06B6D4",
  "#A855F7",
  "#EF4444",
  "#3B82F6",
];

// ---------- Background ----------
const Backdrop: React.FC<{ src: string; accent: string }> = ({
  src,
  accent,
}) => (
  <AbsoluteFill
    style={{ backgroundImage: `url(${src})`, backgroundSize: "cover" }}
  >
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: `radial-gradient(circle at 30% 30%, ${accent}55, transparent 70%)`,
      }}
    />
  </AbsoluteFill>
);

// ---------- Header ----------
const Header: React.FC<{
  title: string;
  subtitle?: string;
  accent: string;
  titleFontSize: number;
  subtitleFontSize: number;
  subtitleColor: string;
  titleFontColor: string;
}> = ({
  title,
  subtitle,
  accent,
  titleFontSize,
  subtitleFontSize,
  subtitleColor,
  titleFontColor,
}) => {
  const frame = useCurrentFrame();
  const slide = interpolate(frame, [0, 20], [40, 0], {
    easing: Easing.out(Easing.cubic),
    extrapolateRight: "clamp",
  });
  const fade = interpolate(frame, [0, 15], [0, 1], {
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        textAlign: "center",
        transform: `translateY(${slide}px)`,
        opacity: fade,
        marginTop: 90,
        padding: 80,
      }}
    >
      <h1
        style={{
          color: titleFontColor,
          fontSize: titleFontSize,
          fontWeight: 900,
          margin: 0,
        }}
      >
        {title}
      </h1>
      {subtitle && (
        <h2
          style={{
            color: subtitleColor,
            fontSize: subtitleFontSize,
            marginTop: 8,
            fontWeight: 500,
          }}
        >
          {subtitle}
        </h2>
      )}
      <div
        style={{
          width: 260,
          height: 14,
          borderRadius: 999,
          background: accent,
          margin: "12px auto 0",
          boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
        }}
      />
    </div>
  );
};

// ---------- Bar ----------
const BarRow: React.FC<{
  i: number;
  name: string;
  value: number;
  max: number;
  appearFrame: number;
  currency?: string;
  accent: string;
  barHeight: number;
  labelFontSize: number;
  valueFontSize: number;
}> = ({
  i,
  name,
  value,
  max,
  appearFrame,
  currency,
  accent,
  barHeight,
  labelFontSize,
  valueFontSize,
}) => {
  const frame = useCurrentFrame();
  const grow = interpolate(frame, [appearFrame, appearFrame + 25], [0, value], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const opacity = interpolate(
    frame,
    [appearFrame - 5, appearFrame + 10],
    [0, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );

  const widthPct = (grow / max) * 100;
  const barColor = colors[i % colors.length];

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 20,
        opacity,
      }}
    >
      {/* Rank circle */}
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: "50%",
          background: "#1e293b",
          color: "white",
          fontWeight: 800,
          fontSize: 28,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 4px 10px rgba(0,0,0,0.4)",
        }}
      >
        {i + 1}
      </div>

      {/* Bar container */}
      <div
        style={{
          flex: 1,
          height: barHeight,
          borderRadius: 20,
          position: "relative",
          background: "linear-gradient(90deg, #111, #1e1e1e)",
          boxShadow:
            i === 0
              ? `0 0 0 3px ${accent}66, 0 16px 32px rgba(0,0,0,0.6)`
              : "0 12px 28px rgba(0,0,0,0.5)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${Math.min(widthPct, 100)}%`,
            background: `linear-gradient(90deg, ${barColor}, ${barColor}cc)`,
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 28px",
          }}
        >
          <span
            style={{ color: "white", fontWeight: 800, fontSize: labelFontSize }}
          >
            {name}
          </span>
          <div
            style={{
              color: "white",
              fontWeight: 900,
              fontSize: valueFontSize,
              padding: "10px 20px",
              borderRadius: 16,
              background: "rgba(0,0,0,0.4)",
              boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
            }}
          >
            {formatValue(value, currency)}
          </div>
        </div>
      </div>
    </div>
  );
};

// ---------- Main ----------
export const BarGraph: React.FC<BarGraphProps> = ({
  data,
  title,
  titleFontColor,
  backgroundImage,
  accent,
  subtitle,
  currency,
  titleFontSize = 90,
  subtitleFontSize = 50,
  subtitleColor = "#a5b4fc",
  barHeight = 90,
  barGap = 34,
  barLabelFontSize = 34,
  barValueFontSize = 34,
  fontFamily,
}) => {
  const { width, height } = useVideoConfig();

  const cleaned = useMemo(
    () =>
      data.map((d) => ({
        name: d.name,
        value: extractNumericValue(d.value),
      })),
    [data],
  );

  if (!cleaned.length) {
    return (
      <AbsoluteFill>
        <Backdrop src={backgroundImage} accent={accent} />
        <Header
          title={title}
          subtitle="No data available"
          accent={accent}
          titleFontSize={titleFontSize}
          subtitleFontSize={subtitleFontSize}
          subtitleColor={subtitleColor}
          titleFontColor={titleFontColor}
        />
      </AbsoluteFill>
    );
  }

  const maxValue = Math.max(...cleaned.map((d) => d.value));
  const firstBarAt = 40;

  return (
    <AbsoluteFill style={{ fontFamily: fontFamily }}>
      <Backdrop src={backgroundImage} accent={accent} />
      <Header
        title={title}
        subtitle={subtitle}
        accent={accent}
        titleFontSize={titleFontSize}
        subtitleFontSize={subtitleFontSize}
        subtitleColor={subtitleColor}
        titleFontColor={titleFontColor}
      />

      <div
        style={{
          position: "absolute",
          top: height * 0.32,
          left: width * 0.06,
          width: width * 0.88,
          display: "flex",
          flexDirection: "column",
          gap: barGap,
        }}
      >
        {cleaned.map((d, i) => (
          <BarRow
            key={d.name}
            i={i}
            name={d.name}
            value={d.value}
            max={maxValue}
            appearFrame={firstBarAt + i * 15}
            currency={currency}
            accent={accent}
            barHeight={barHeight}
            labelFontSize={barLabelFontSize}
            valueFontSize={barValueFontSize}
          />
        ))}
      </div>
    </AbsoluteFill>
  );
};
