import React from 'react';
import {
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  Easing,
  staticFile,
  Img,
} from 'remotion'; 

// --- INTERFACES ---
export interface LanguageData {
  name: string;
  usage: number; 
  squares: number; 
  logo: string; 
}

export interface HeatmapConfig {
  id: string;
  title: string;
  subtitle: string;
  textColor: string; 
  languages: LanguageData[];
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  maxValue: number;
  backgroundStyle: 'gradient' | 'radial';
  [key: string]: unknown; // Index signature for Remotion
}

// This interface defines the props for the composition component itself
interface HeatmapCompositionProps extends Record<string, unknown> {
  config: HeatmapConfig;
}

// --- HELPER FUNCTIONS ---

// Helper to convert hex to RGB object
const hexToRgb = (hex: string) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 255, g: 255, b: 255 }; // Default to white if parse fails
};

// --- MAIN COMPOSITION ---

export const HeatmapComposition: React.FC<HeatmapCompositionProps> = ({
  config,
}) => {
  // Destructure config for easier use
  const {
    title,
    subtitle,
    textColor = '#FFFFFF', // <-- ADDED with default
    languages: languageData,
    primaryColor,
    secondaryColor,
    accentColor,
    maxValue = 100,
    backgroundStyle = 'gradient',
  } = config;

  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // --- ANIMATION TIMING ---
  const squareDelayFrames = Math.floor(fps * 0.08); // 80ms
  const rowGapFrames = Math.floor(fps * 0.15); // 150ms
  const legendDelayFrames = Math.floor(fps * 0.5); // 500ms

  // --- ANIMATION LOGIC ---

  // Calculate which squares are visible
  const getVisibleSquares = () => {
    const visibleSquares = new Set();
    let frameCounter = 0;

    for (let rowIndex = 0; rowIndex < languageData.length; rowIndex++) {
      const language = languageData[rowIndex];
      for (let squareIndex = 0; squareIndex < language.squares; squareIndex++) {
        const squareId = `${rowIndex}-${squareIndex}`;
        if (frame >= frameCounter) {
          visibleSquares.add(squareId);
        }
        frameCounter += squareDelayFrames;
      }
      frameCounter += rowGapFrames;
    }
    return visibleSquares;
  };

  // Calculate which rows are fully animated
  const getCompletedRows = () => {
    const completedRows = new Set();
    let frameCounter = 0;

    for (let rowIndex = 0; rowIndex < languageData.length; rowIndex++) {
      const language = languageData[rowIndex];
      // Frame when this row's animation ends
      const rowEndFrame =
        frameCounter +
        language.squares * squareDelayFrames +
        Math.floor(fps * 0.2);

      if (frame >= rowEndFrame) {
        completedRows.add(rowIndex);
      }
      frameCounter += language.squares * squareDelayFrames + rowGapFrames;
    }
    return completedRows;
  };

  // Calculate when to show the legend
  const getShowLegend = () => {
    let totalFrames = 0;
    for (const language of languageData) {
      totalFrames += language.squares * squareDelayFrames + rowGapFrames;
    }
    return frame >= totalFrames + legendDelayFrames;
  };

  const visibleSquares = getVisibleSquares();
  const completedRows = getCompletedRows();
  const showLegend = getShowLegend();

  // Find max squares for layout
  const maxSquares = Math.max(...languageData.map((lang) => lang.squares));

  // Dynamic color interpolation
  const getColorForUsage = (usage: number) => {
    const normalizedUsage = Math.min(usage / maxValue, 1);

    // Interpolate from Primary to Secondary
    if (normalizedUsage < 0.5) {
      const factor = normalizedUsage / 0.5;
      const primaryRgb = hexToRgb(primaryColor);
      const secondaryRgb = hexToRgb(secondaryColor);

      const r = Math.round(primaryRgb.r + (secondaryRgb.r - primaryRgb.r) * factor);
      const g = Math.round(primaryRgb.g + (secondaryRgb.g - primaryRgb.g) * factor);
      const b = Math.round(primaryRgb.b + (secondaryRgb.b - primaryRgb.b) * factor);
      return `rgb(${r}, ${g}, ${b})`;
    }
    // Interpolate from Secondary to Accent
    else {
      const factor = (normalizedUsage - 0.5) / 0.5;
      const secondaryRgb = hexToRgb(secondaryColor);
      const accentRgb = hexToRgb(accentColor);

      const r = Math.round(secondaryRgb.r + (accentRgb.r - secondaryRgb.r) * factor);
      const g = Math.round(secondaryRgb.g + (accentRgb.g - secondaryRgb.g) * factor);
      const b = Math.round(secondaryRgb.b + (accentRgb.b - secondaryRgb.b) * factor);
      return `rgb(${r}, ${g}, ${b})`;
    }
  };

  // Animated counter component
  const AnimatedCounter: React.FC<{ value: number; rowIndex: number }> = ({
    value,
    rowIndex,
  }) => {
    const getCounterValue = () => {
      if (!completedRows.has(rowIndex)) return 0;

      // Find when this row completed
      let rowCompletionFrame = 0;
      for (let i = 0; i <= rowIndex; i++) {
        rowCompletionFrame +=
          languageData[i].squares * squareDelayFrames + rowGapFrames;
      }
      rowCompletionFrame += Math.floor(fps * 0.2); // Add buffer

      if (frame < rowCompletionFrame) return 0;

      // Animate the count-up
      const animationDuration = Math.floor(fps * 0.8);
      const framesElapsed = frame - rowCompletionFrame;
      const progress = Math.min(framesElapsed / animationDuration, 1);
      const easedProgress = 1 - Math.pow(1 - progress, 3); // Ease out cubic

      return value * easedProgress;
    };

    const currentValue = getCounterValue();
    // Format to one decimal place
    return <span>{currentValue.toFixed(1)}%</span>;
  };

  // Title animation
  const titleOpacity = interpolate(frame, [20, 60], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const titleY = interpolate(frame, [20, 60], [30, 50], {
    easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <div
      style={{
        width: '1080px',
        height: '1920px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background:
          backgroundStyle === 'gradient'
            ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)'
            : 'radial-gradient(ellipse at center top, #1e293b 0%, #0f172a 70%, #020617 100%)',
        color: 'white',
        padding: '60px 40px',
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Inter", sans-serif',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background particles */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          opacity: 0.1,
        }}
      >
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              width: '2px',
              height: '2px',
              background: primaryColor,
              borderRadius: '50%',
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `twinkle${i} ${
                2 + Math.random() * 3
              }s infinite alternate`,
            }}
          />
        ))}
        <style>{`
          ${[...Array(20)]
            .map(
              (_, i) => `
            @keyframes twinkle${i} {
              from { opacity: 0.3; }
              to { opacity: 1; }
            }
          `
            )
            .join('')}
        `}</style>
      </div>

      {/* Header */}
      <div
        style={{
          position: 'absolute',
          top: titleY,
          left: '50%',
          transform: 'translateX(-50%)',
          opacity: titleOpacity,
          textAlign: 'center',
          width: '100%',
          zIndex: 10,
        }}
      >
       <h1
          style={{
            fontSize: '52px',
            fontWeight: '800',
            
            // --- MODIFICATION ---
            // Conditionally apply gradient styles ONLY if title is not empty
            ...( (title && title.trim() !== '') && {
              background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor}, ${accentColor})`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }),
            // Fallback text color (won't be seen if gradient is active)
            color: textColor, 
            // --- END MODIFICATION ---

            marginBottom: '20px',
            lineHeight: '1.2',
            letterSpacing: '-0.5px',
          }}
        >
          {title}
        </h1>
        <p
          style={{
            // --- MODIFIED ---
            color: textColor, // Use new prop
            opacity: 0.7, // Keep it subtle
            fontSize: '24px',
            fontWeight: '500',
          }}
        >
          {subtitle}
        </p>
      </div>

      {/* Main Grid */}
      <div
        style={{
          width: '100%',
          maxWidth: '900px',
          marginBottom: '60px',
          marginTop: '120px',
        }}
      >
        {languageData.map((language, rowIndex) => (
          <div
            key={language.name}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '30px',
              marginBottom: '35px',
              width: '100%',
            }}
          >
            {/* Language Label */}
            <div
              style={{
                width: '280px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                gap: '20px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-end',
                  gap: '8px',
                }}
              >
                <div
                  style={{
                    fontSize: '26px',
                    fontWeight: '600',
                    // --- MODIFIED ---
                    color: completedRows.has(rowIndex) ? textColor : '#94a3b8',
                    transform: completedRows.has(rowIndex)
                      ? 'scale(1.1)'
                      : 'scale(1)',
                    transition: 'all 0.3s ease',
                  }}
                >
                  {language.name}
                </div>
                <div
                  style={{
                    fontSize: '20px',
                    fontWeight: '500',
                    // --- MODIFIED ---
                    color: completedRows.has(rowIndex) ? textColor : '#64748b',
                    opacity: completedRows.has(rowIndex) ? 0.9 : 0,
                    transition: 'all 0.5s ease',
                  }}
                >
                  <AnimatedCounter value={language.usage} rowIndex={rowIndex} />
                </div>
              </div>

              {/* Logo */}
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: completedRows.has(rowIndex) ? 1 : 0.6,
                  transform: completedRows.has(rowIndex)
                    ? 'scale(1.2)'
                    : 'scale(1)',
                  filter: completedRows.has(rowIndex)
                    ? `brightness(1.2) drop-shadow(0 0 12px ${primaryColor}60)`
                    : 'none',
                  transition: 'all 0.5s ease',
                }}
              >
                {/* Use staticFile() for logos */}
                <Img
                  src={staticFile(`logos/${language.logo}`)}
                  alt={`${language.name} logo`}
                  style={{
                    width: '44px',
                    height: '44px',
                    objectFit: 'contain',
                  }}
                  onError={(e) => {
                    // Fallback for missing logos
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
            </div>

            {/* Grid Squares */}
            <div
              style={{
                display: 'flex',
                gap: '8px',
                flex: 1,
              }}
            >
              {Array.from({ length: maxSquares }, (_, squareIndex) => {
                const squareId = `${rowIndex}-${squareIndex}`;
                const isVisible = visibleSquares.has(squareId);
                const hasData = squareIndex < language.squares;

                return (
                  <div
                    key={squareIndex}
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '6px',
                      backgroundColor: hasData
                        ? getColorForUsage(language.usage)
                        : 'transparent',
                      transform: hasData && isVisible ? 'scale(1)' : 'scale(0)',
                      opacity: hasData && isVisible ? 1 : 0,
                      transition: `all 0.3s ease ${squareIndex * 50}ms`,
                      boxShadow:
                        hasData && isVisible
                          ? `0 0 16px ${
                              getColorForUsage(language.usage)
                            }60, 0 4px 8px rgba(0,0,0,0.3)`
                          : 'none',
                    }}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div
        style={{
          opacity: showLegend ? 1 : 0,
          transform: showLegend ? 'translateY(0)' : 'translateY(30px)',
          transition: 'all 0.7s ease',
          width: '100%',
          maxWidth: '700px',
        }}
      >
        <div
          style={{
            background: 'rgba(30, 41, 59, 0.7)',
            backdropFilter: 'blur(12px)',
            borderRadius: '20px',
            padding: '40px',
            border: `1px solid ${primaryColor}30`,
          }}
        >
          <h3
            style={{
              fontSize: '28px',
              fontWeight: '600',
              marginBottom: '30px',
              textAlign: 'center',
              // --- MODIFIED ---
              color: textColor,
            }}
          >
            Usage Scale
          </h3>

          {/* Color Scale */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '20px',
              marginBottom: '30px',
            }}
          >
            <span
              style={{
                fontSize: '18px',
                // --- MODIFIED ---
                color: textColor,
                opacity: 0.7,
                minWidth: '40px',
              }}
            >
              0%
            </span>
            <div
              style={{
                flex: 1,
                height: '20px',
                borderRadius: '10px',
                background: `linear-gradient(90deg, ${primaryColor}, ${secondaryColor}, ${accentColor})`,
                overflow: 'hidden',
              }}
            ></div>
            <span
              style={{
                fontSize: '18px',
                // --- MODIFIED ---
                color: textColor,
                opacity: 0.7,
                minWidth: '60px',
              }}
            >
              {maxValue}%+
            </span>
          </div>

          {/* Color Labels */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '18px',
              // --- MODIFIED ---
              color: textColor,
            }}
          >
            <span
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <div
                style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  backgroundColor: primaryColor,
                }}
              ></div>
              Low
            </span>
            <span
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <div
                style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  backgroundColor: secondaryColor,
                }}
              ></div>
              Medium
            </span>
            <span
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <div
                style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  backgroundColor: accentColor,
                }}
              ></div>
              High
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};