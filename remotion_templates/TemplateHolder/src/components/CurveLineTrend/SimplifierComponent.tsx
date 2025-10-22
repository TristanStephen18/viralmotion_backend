import React from "react";
// import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import {
  defaultGraphProps,
  TrendGraphRemotion,
  type DataPoint,
  type GraphProps,
} from "./MainComponent";

// 👇 Simpler prop set for live editor
export type SimpleGraphProps = {
  title: string;
  subtitle?: string;
  titleFontSize?: number;
  subtitleFontSize?: number;
  fontFamily?: string; 
  data: DataPoint[];
  dataType?: "$" | "%" | "#" | "number";
  preset?:
    | "dark"
    | "light"
    | "corporate"
    | "playful"
    | "midnight"
    | "slate"
    | "aurora"
    | "prestige"
    | "graphite"
    | "horizon"
    | "crimson"
    | "ruby"
    | "emerald"
    | "amber"
    | "moss"
    | "sunset";
  backgroundImage?: string; // replaces gradient
  animationSpeed?: "slow" | "normal" | "fast";
  minimalMode?: boolean; // hides grid, progress bar, floating symbols
};

// 🎨 Preset themes
const themes = {
  dark: defaultGraphProps.theme,
  light: {
    ...defaultGraphProps.theme,
    bgGradient: "linear-gradient(135deg, #f8fafc, #e2e8f0)",
    dot: "#2563eb",
    labelText: "#0f172a",
    axisText: "#475569",
    accent: "#1e293b",
  },
  corporate: {
    ...defaultGraphProps.theme,
    bgGradient: "linear-gradient(135deg, #0f172a, #334155)",
    dot: "#14b8a6",
    accent: "#f8fafc",
  },
  playful: {
    ...defaultGraphProps.theme,
    bgGradient: "linear-gradient(135deg, #f472b6, #facc15)",
    dot: "#f97316",
    accent: "#ffffff",
  },
  midnight: {
    ...defaultGraphProps.theme,
    bgGradient: "linear-gradient(135deg, #0f172a, #1e293b)",
    dot: "#60a5fa",
    accent: "#cbd5e1",
  },
  slate: {
    ...defaultGraphProps.theme,
    bgGradient: "linear-gradient(135deg, #1e293b, #334155)",
    dot: "#38bdf8",
    accent: "#cbd5e1",
  },
  aurora: {
    ...defaultGraphProps.theme,
    bgGradient: "linear-gradient(135deg, #1e293b, #0f766e)",
    dot: "#2dd4bf",
    accent: "#a7f3d0",
  },
  prestige: {
    ...defaultGraphProps.theme,
    bgGradient: "linear-gradient(135deg, #312e81, #1e1b4b)",
    dot: "#818cf8",
    accent: "#a5b4fc",
  },
  graphite: {
    ...defaultGraphProps.theme,
    bgGradient: "linear-gradient(135deg, #111827, #1f2937)",
    dot: "#9ca3af",
    accent: "#d1d5db",
  },
  horizon: {
    ...defaultGraphProps.theme,
    bgGradient: "linear-gradient(135deg, #1e293b, #2563eb)",
    dot: "#93c5fd",
    accent: "#dbeafe",
  },
  emerald: {
    ...defaultGraphProps.theme,
    bgGradient: "linear-gradient(135deg, #064e3b, #065f46)",
    dot: "#34d399",
    accent: "#a7f3d0",
  },
  amber: {
    ...defaultGraphProps.theme,
    bgGradient: "linear-gradient(135deg, #78350f, #92400e)",
    dot: "#fbbf24",
    accent: "#fde68a",
  },
  crimson: {
    ...defaultGraphProps.theme,
    bgGradient: "linear-gradient(135deg, #7f1d1d, #991b1b)",
    dot: "#f87171",
    accent: "#fca5a5",
  },
  moss: {
    ...defaultGraphProps.theme,
    bgGradient: "linear-gradient(135deg, #14532d, #166534)",
    dot: "#86efac",
    accent: "#4ade80",
  },
  sunset: {
    ...defaultGraphProps.theme,
    bgGradient: "linear-gradient(135deg, #7c2d12, #9a3412)",
    dot: "#fb923c",
    accent: "#fed7aa",
  },
  ruby: {
    ...defaultGraphProps.theme,
    bgGradient: "linear-gradient(135deg, #450a0a, #991b1b)",
    dot: "#ef4444",
    accent: "#f87171",
  },
};

// ⏱ Animation speed presets
const timelineMap = {
  slow: { drawSeconds: 8, rippleSeconds: 4, sparkSeconds: 0 },
  normal: { drawSeconds: 5, rippleSeconds: 2, sparkSeconds: 0 },
  fast: { drawSeconds: 3, rippleSeconds: 1, sparkSeconds: 0 },
};

// 🪄 Mapping helper
function mapSimpleToGraphProps(p: SimpleGraphProps): GraphProps {
  const theme = themes[p.preset ?? "dark"];

  return {
    ...defaultGraphProps,
    title: p.title,
    subtitle: p.subtitle,
    titleFontSize: p.titleFontSize,
    subtitleFontSize: p.subtitleFontSize,
    fontFamily: p.fontFamily,
    data: p.data,
    dataType: p.dataType,
    theme: {
      ...theme,
      // replace gradient with user-provided background image if available
      bgGradient: p.backgroundImage
        ? `url(${p.backgroundImage}) center/cover no-repeat`
        : theme.bgGradient,
    },
    timeline: timelineMap[p.animationSpeed ?? "normal"],
    flags: p.minimalMode
      ? {
          ...defaultGraphProps.flags,
          showGrid: false,
          showProgressBar: false,
          showFloatingSymbols: false,
        }
      : defaultGraphProps.flags,
    axis: defaultGraphProps.axis,
  };
}

// 🚀 Simplified wrapper component
export const SimpleTrendGraph: React.FC<SimpleGraphProps> = (props) => {
  const graphProps = mapSimpleToGraphProps(props);
  return <TrendGraphRemotion {...graphProps} />;
};
