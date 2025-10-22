import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  Easing,
} from "remotion";

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

export type DataPoint = {
  label: string | number;
  value: number;
  isHighlight?: boolean;
};

export type TimelineConfig = {
  drawSeconds: number;
  rippleSeconds: number;
  sparkSeconds: number;
};

export type Theme = {
  bgGradient: string;
  gridColor: string;
  lineStops: [string, string, string, string];
  areaTop: string;
  areaBottom: string;
  dot: string;
  dotStroke: string;
  highlightDot: string;
  highlightStroke: string;
  labelText: string;
  axisText: string;
  progressBarTrack: string;
  progressBarFill: string;
  accent: string;
};

export type Flags = {
  showGrid: boolean;
  showArea: boolean;
  showXLabels: boolean;
  showYLabels: boolean;
  showTitle: boolean;
  showSubtitle: boolean;
  showCurrentCard: boolean;
  showProgressBar: boolean;
  showFloatingSymbols: boolean;
};

export type Axis = {
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
  yTicks: Array<{ y: number; label: string }>;
};

export type GraphProps = {
  title?: string;
  subtitle?: string;
  titleFontSize?: number;
  subtitleFontSize?: number;
  fontFamily?: string;
  dataType?: string;
  currency?: string;
  symbol?: string;
  data: DataPoint[];
  timeline: TimelineConfig;
  theme: Theme;
  flags: Flags;
  axis: Axis;
  revealWindow?: number;
  floatingCount?: number;
  floatingChar?: string;
  valueFormatter?: (value: number) => string;
};

// Create smart default formatter based on data
function createDefaultFormatter(data: DataPoint[], dataType?: string) {
  const maxValue = Math.max(...data.map(d => d.value));
  
  if (dataType) {
    switch (dataType.toLowerCase()) {
      case '$':
        if (maxValue >= 1_000_000_000) {
          return (value: number) => `$${(value / 1_000_000_000).toFixed(1)}B`;
        } else if (maxValue >= 1_000_000) {
          return (value: number) => `$${(value / 1_000_000).toFixed(1)}M`;
        } else if (maxValue >= 1_000) {
          return (value: number) => `$${(value / 1_000).toFixed(1)}K`;
        } else {
          return (value: number) => `$${value.toFixed(2)}`;
        }
      case '%':
        return (value: number) => `${value.toFixed(1)}%`;
      case '#':
        if (maxValue >= 1_000_000) {
          return (value: number) => `${(value / 1_000_000).toFixed(1)}M`;
        } else if (maxValue >= 1_000) {
          return (value: number) => `${(value / 1_000).toFixed(1)}K`;
        } else {
          return (value: number) => `${value.toFixed(0)}`;
        }
      default:
        return (value: number) => `${value.toFixed(1)}`;
    }
  }
  
  // Generic formatting
  if (maxValue >= 1_000_000_000) {
    return (value: number) => `${(value / 1_000_000_000).toFixed(1)}B`;
  } else if (maxValue >= 1_000_000) {
    return (value: number) => `${(value / 1_000_000).toFixed(1)}M`;
  } else if (maxValue >= 1_000) {
    return (value: number) => `${(value / 1_000).toFixed(1)}K`;
  } else {
    return (value: number) => `${value.toFixed(1)}`;
  }
}

// Generate dynamic Y-axis ticks
function generateDynamicYTicks(data: DataPoint[], axis: Axis, formatter: (value: number) => string) {
  const maxValue = Math.max(...data.map(d => d.value));
  const minValue = Math.min(...data.map(d => d.value));
  const range = maxValue - minValue;
  const yRange = axis.yMax - axis.yMin;
  
  const numTicks = 5;
  const ticks = [];
  
  for (let i = 0; i < numTicks; i++) {
    const value = maxValue - (i / (numTicks - 1)) * range;
    const y = axis.yMin + (i / (numTicks - 1)) * yRange;
    ticks.push({
      y: y,
      label: formatter(value)
    });
  }
  
  return ticks;
}

export const defaultGraphProps: GraphProps = {
  title: "Data Trend Visualization",
  subtitle: "2015 - 2024 • Growth Journey",
  dataType: "",
  symbol: "📊",
  data: [
    { label: 2015, value: 100 },
    { label: 2016, value: 150 },
    { label: 2017, value: 300 },
    { label: 2018, value: 200 },
    { label: 2019, value: 250 },
    { label: 2020, value: 400 },
    { label: 2021, value: 550 },
    { label: 2022, value: 450 },
    { label: 2023, value: 600 },
    { label: 2024, value: 750 },
  ],
  timeline: {
    drawSeconds: 5,
    rippleSeconds: 2,
    sparkSeconds: 0,
  },
  theme: {
    bgGradient: "linear-gradient(135deg, #1e293b, #475569 40%, #0f172a)",
    gridColor: "#64748b",
    lineStops: ["#3b82f6", "#1d4ed8", "#1e40af", "#1e3a8a"],
    areaTop: "rgba(59, 130, 246, 0.30)",
    areaBottom: "rgba(59, 130, 246, 0.05)",
    dot: "#3b82f6",
    dotStroke: "#ffffff",
    highlightDot: "#f59e0b",
    highlightStroke: "#f59e0b",
    labelText: "#ffffff",
    axisText: "#64748b",
    progressBarTrack: "rgba(71,85,105,0.5)",
    progressBarFill: "linear-gradient(90deg, #3b82f6, #f59e0b)",
    accent: "#f1f5f9",
  },
  flags: {
    showGrid: true,
    showArea: true,
    showXLabels: true,
    showYLabels: true,
    showTitle: true,
    showSubtitle: true,
    showCurrentCard: false,
    showProgressBar: true,
    showFloatingSymbols: true,
  },
  axis: {
    xMin: 10,
    xMax: 90,
    yMin: 20,
    yMax: 80,
    yTicks: []
  },
  revealWindow: 0.12,
  floatingCount: 6,
  floatingChar: "📈"
};

export const TrendGraphRemotion: React.FC<GraphProps> = (props) => {
  const p = { ...defaultGraphProps, ...props };

  const frame = useCurrentFrame();
  const { width, height, durationInFrames, fps } = useVideoConfig();

  // Create smart value formatter
  const valueFormatter = p.valueFormatter || createDefaultFormatter(p.data, p.dataType);

  // Generate Y-axis ticks if not provided
  let yTicks = p.axis.yTicks;
  if (!yTicks || yTicks.length === 0) {
    yTicks = generateDynamicYTicks(p.data, p.axis, valueFormatter);
  }

  // Timing calculations
  const DRAW_END = Math.round(p.timeline.drawSeconds * fps);
  const RIPPLE_START = DRAW_END;
  const RIPPLE_DURATION = Math.round(p.timeline.rippleSeconds * fps);
  const RIPPLE_END = RIPPLE_START + RIPPLE_DURATION;
  const HOLD_START = RIPPLE_END;
  const HOLD_DURATION = Math.round(3 * fps); // 3 seconds hold
  const HOLD_END = HOLD_START + HOLD_DURATION;

  const animationPhase = frame < RIPPLE_START ? "drawing" : 
                        frame < RIPPLE_END ? "ripples" : "hold";

  const drawProgress = Math.min(frame / Math.max(1, DRAW_END), 1);
  const progressPct = (frame / Math.max(1, durationInFrames - 1)) * 100;

  // Data normalization
  const maxVal = Math.max(...p.data.map((d) => d.value));
  const minVal = Math.min(...p.data.map((d) => d.value));
  const xRange = p.axis.xMax - p.axis.xMin;
  const yRange = p.axis.yMax - p.axis.yMin;

  const points = p.data.map((point, index) => {
    const xPos = (index / Math.max(1, p.data.length - 1)) * xRange + p.axis.xMin;
    const normalized = (point.value - minVal) / Math.max(1, maxVal - minVal);
    const yPos = p.axis.yMax - normalized * (yRange - 5);
    return {
      x: xPos,
      y: yPos,
      value: point.value,
      label: point.label,
      index,
      isHighlight: false,
    };
  });

  const createSmoothPath = (pts: typeof points) => {
    if (pts.length < 2) return "";
    let path = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 1; i < pts.length; i++) {
      const prev = pts[i - 1];
      const curr = pts[i];
      if (i === 1) {
        path += ` Q ${(prev.x + curr.x) / 2} ${prev.y} ${curr.x} ${curr.y}`;
      } else {
        const cp1x = prev.x + (curr.x - prev.x) * 0.3;
        const cp1y = prev.y;
        const cp2x = curr.x - (curr.x - prev.x) * 0.3;
        const cp2y = curr.y;
        path += ` C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${curr.x} ${curr.y}`;
      }
    }
    return path;
  };

  const pathString = createSmoothPath(points);
  const pathLength = 500;
  const strokeDashoffset = pathLength * (1 - drawProgress);

  const rippleActiveIndex = (() => {
    if (animationPhase !== "ripples") return -1;
    
    const rippleProgress = (frame - RIPPLE_START) / RIPPLE_DURATION;
    const pointIndex = Math.floor(rippleProgress * points.length);
    
    // Ensure we don't exceed the number of points and only animate once
    return Math.min(pointIndex, points.length - 1);
  })();

  // Floating symbols
  const floatSymbols = Array.from({ length: p.floatingCount ?? 0 }, (_, i) => {
    const top = 25 + Math.sin(frame * 0.02 + i) * 8;
    const left = 15 + i * 12;
    const fontSize = 12 + i;
    const opacity = 0.2 + 0.05 * Math.sin(frame * 0.08 + i);
    return { top, left, fontSize, opacity };
  });

  const REVEAL_WINDOW = p.revealWindow ?? 0.12;

  // Dynamic status text based on data type
  const getStatusText = () => {
    const baseTexts = {
      drawing: "Drawing the trend...",
      ripples: "Highlighting data points...",
      hold: "Analysis complete"
    };

    if (p.dataType) {
      const dataTypeTexts = {
        '$': { 
          drawing: "Tracking financial growth...", 
          ripples: "Analyzing market milestones...",
          hold: "Financial analysis complete"
        },
        '%': { 
          drawing: "Measuring progress...", 
          ripples: "Highlighting key metrics...",
          hold: "Progress analysis complete"
        },
        '#': { 
          drawing: "Counting growth...", 
          ripples: "Marking significant numbers...",
          hold: "Growth analysis complete"
        }
      };
      
      const typeText = dataTypeTexts[p.dataType as keyof typeof dataTypeTexts];
      if (typeText) {
        return typeText[animationPhase as keyof typeof typeText];
      }
    }
    
    return baseTexts[animationPhase as keyof typeof baseTexts];
  };

  return (
    <AbsoluteFill
      style={{
        width,
        height,
        background: "linear-gradient(180deg, #1e293b, #0f172a)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          maxWidth: width,
          maxHeight: height,
          background: p.theme.bgGradient,
        }}
      >
        {/* Background grid */}
        {p.flags.showGrid && (
          <svg
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.1 }}
          >
            <defs>
              <pattern id="grid" width="8" height="8" patternUnits="userSpaceOnUse">
                <path d="M 8 0 L 0 0 0 8" fill="none" stroke={p.theme.gridColor} strokeWidth="0.3" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        )}

        {/* Graph SVG */}
        <svg
          viewBox="0 0 100 100"
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
        >
          <defs>
            <filter id="glow">
              <feGaussianBlur stdDeviation="1.5" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={p.theme.lineStops[0]} stopOpacity={0.8} />
              <stop offset="30%" stopColor={p.theme.lineStops[1]} stopOpacity={1} />
              <stop offset="70%" stopColor={p.theme.lineStops[2]} stopOpacity={1} />
              <stop offset="100%" stopColor={p.theme.lineStops[3]} stopOpacity={0.9} />
            </linearGradient>

            <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={p.theme.areaTop} />
              <stop offset="100%" stopColor={p.theme.areaBottom} />
            </linearGradient>
          </defs>

          {/* Area under curve */}
          {p.flags.showArea && pathString && (
            <path
              d={`${pathString} L ${points[points.length - 1].x} ${p.axis.yMax} L ${points[0].x} ${p.axis.yMax} Z`}
              fill="url(#areaGradient)"
              strokeDasharray={pathLength}
              strokeDashoffset={strokeDashoffset}
            />
          )}

          {/* Main line */}
          {pathString && (
            <path
              d={pathString}
              fill="none"
              stroke="url(#lineGradient)"
              strokeWidth="1.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="url(#glow)"
              strokeDasharray={pathLength}
              strokeDashoffset={strokeDashoffset}
            />
          )}

          {/* Points and labels */}
          {points.map((point, index) => {
            const revealAt = index / points.length;
            const localTRaw =
              (drawProgress - (revealAt - REVEAL_WINDOW)) / (REVEAL_WINDOW * 1.5);
            const localT = clamp01(localTRaw);

            const eased = interpolate(localT, [0, 1], [0, 1], {
              easing: Easing.out(Easing.cubic),
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });

            const pointOpacity = eased;
            const pointScale = 0.8 + 0.2 * eased;
            const labelOpacity = Math.max(0, eased - 0.2) / 0.8;
            const labelDy = (1 - labelOpacity) * 2.5;

            const isActive = animationPhase === "ripples" && rippleActiveIndex === index;

            const rippleScale = isActive ? 1 + 0.3 * Math.sin((frame - RIPPLE_START) * 0.5) : 1;
            const rippleOpacity = isActive ? 0.8 * pointOpacity : 0;

            return (
              <g key={index}>
                {/* Ripples */}
                {isActive && (
                  <>
                    <circle
                      cx={point.x}
                      cy={point.y}
                      r={4 * rippleScale}
                      fill="none"
                      stroke={p.theme.dot}
                      strokeWidth={0.8}
                      opacity={rippleOpacity}
                    />
                    <circle
                      cx={point.x}
                      cy={point.y}
                      r={8 * rippleScale}
                      fill="none"
                      stroke={p.theme.dot}
                      strokeWidth={0.4}
                      opacity={rippleOpacity * 0.5}
                    />
                  </>
                )}

                {/* Dot */}
                <g
                  transform={`translate(${point.x} ${point.y}) scale(${pointScale})`}
                  opacity={pointOpacity}
                >
                  <circle
                    cx={0}
                    cy={0}
                    r={2}
                    fill={p.theme.dot}
                    stroke={p.theme.dotStroke}
                    strokeWidth={0.5}
                  />
                </g>

                {/* Labels above point */}
                <g opacity={labelOpacity}>
                  <rect
                    x={point.x - 5}
                    y={point.y - 11 + labelDy}
                    width={10}
                    height={5}
                    rx={1.2}
                    fill="rgba(59, 130, 246, 0.85)"
                    stroke={p.theme.dot}
                    strokeWidth={0.2}
                    opacity={0.95}
                  />
                  <text
                    x={point.x}
                    y={point.y - 8.5 + labelDy}
                    textAnchor="middle"
                    fontSize={1.8}
                    fill={p.theme.labelText}
                    fontWeight="bold"
                  >
                    {valueFormatter(point.value)}
                  </text>
                  <text
                    x={point.x}
                    y={point.y - 6.8 + labelDy}
                    textAnchor="middle"
                    fontSize={1.2}
                    fill={p.theme.labelText}
                    opacity={0.9}
                  >
                    {String(point.label)}
                  </text>
                </g>

                {/* Active popup during ripples */}
                {isActive && (
                  <g opacity={pointOpacity}>
                    <rect
                      x={point.x - 8}
                      y={point.y - 18}
                      width={16}
                      height={8}
                      rx={2}
                      fill="rgba(59, 130, 246, 0.98)"
                      stroke={p.theme.dot}
                      strokeWidth={0.5}
                      filter="url(#glow)"
                    />
                    <text
                      x={point.x}
                      y={point.y - 13.5}
                      textAnchor="middle"
                      fontSize={2.8}
                      fill={p.theme.labelText}
                      fontWeight="bold"
                    >
                      {valueFormatter(point.value)}
                    </text>
                    <text
                      x={point.x}
                      y={point.y - 11}
                      textAnchor="middle"
                      fontSize={1.8}
                      fill={p.theme.labelText}
                      opacity={0.95}
                    >
                      {String(point.label)}
                    </text>
                  </g>
                )}
              </g>
            );
          })}

          {/* Axes */}
          <line
            x1={p.axis.xMin}
            y1={p.axis.yMax}
            x2={p.axis.xMax}
            y2={p.axis.yMax}
            stroke={p.theme.axisText}
            strokeWidth={0.4}
            opacity={0.6}
          />
          <line
            x1={p.axis.xMin}
            y1={p.axis.yMin}
            x2={p.axis.xMin}
            y2={p.axis.yMax}
            stroke={p.theme.axisText}
            strokeWidth={0.4}
            opacity={0.6}
          />

          {/* X labels */}
          {p.flags.showXLabels &&
            points.map((point, index) => {
              const revealAt = index / points.length;
              const localTRaw =
                (drawProgress - (revealAt - REVEAL_WINDOW)) / (REVEAL_WINDOW * 1.5);
              const localT = clamp01(localTRaw);
              const eased = interpolate(localT, [0, 1], [0, 1], {
                easing: Easing.out(Easing.cubic),
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              });
              return (
                <text
                  key={`x-${index}`}
                  x={point.x}
                  y={p.axis.yMax + 4}
                  fontSize={2}
                  fill={p.theme.axisText}
                  textAnchor="middle"
                  opacity={eased * 0.9}
                >
                  {String(point.label)}
                </text>
              );
            })}

          {/* Dynamic Y labels */}
          {p.flags.showYLabels &&
            yTicks.map((t, i) => (
              <text
                key={`y-${i}`}
                x={p.axis.xMin - 3}
                y={t.y}
                fontSize={2}
                fill={p.theme.axisText}
                textAnchor="start"
                opacity={0.8}
              >
                {t.label}
              </text>
            ))}
        </svg>

        {/* Title + subtitle - MOVED LOWER */}
        {p.flags.showTitle && (
          <div style={{ position: "absolute", top: 250, left: 24, right: 24, textAlign: "center" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 8,
              }}
            >
              <span style={{ fontSize: 48, marginRight: 8 }}>{p.floatingChar}</span>
              <div
                style={{
                  fontSize: p.titleFontSize ? p.titleFontSize : 32,
                  fontWeight: 800,
                  color: p.theme.accent,
                  letterSpacing: 1,
                  fontFamily: p.fontFamily ? p.fontFamily : "Arial, sans-serif"
                }}
              >
                {p.title}
              </div>
            </div>
            {p.flags.showSubtitle && (
                  
              <div style={{ fontFamily: p.fontFamily ? p.fontFamily : "Arial, sans-serif", color: p.theme.axisText, fontSize: p.subtitleFontSize ? p.subtitleFontSize : 20, opacity: 0.9,  }}>
                {p.subtitle}
              </div>
            )}
          </div>
        )}

        {/* Progress bar */}
        {p.flags.showProgressBar && (
          <div style={{ position: "absolute", left: 24, right: 24, bottom: 24 }}>
            <div
              style={{
                height: 6,
                background: p.theme.progressBarTrack,
                borderRadius: 999,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${progressPct}%`,
                  background: p.theme.progressBarFill,
                }}
              />
            </div>
            <div
              style={{
                textAlign: "center",
                marginTop: 12,
                fontSize: 14,
                color: p.theme.gridColor,
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
              }}
            >
              {getStatusText()}
            </div>
          </div>
        )}

        {/* Floating symbols */}
        {p.flags.showFloatingSymbols && (
          <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
            {floatSymbols.map((s, i) => (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: `${s.left}%`,
                  top: `${s.top}%`,
                  fontSize: s.fontSize,
                  color: p.theme.dot,
                  opacity: s.opacity,
                }}
              >
                {p.floatingChar}
              </div>
            ))}
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};