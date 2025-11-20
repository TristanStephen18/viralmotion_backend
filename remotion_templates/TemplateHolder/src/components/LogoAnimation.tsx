import React from 'react';
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  Easing,
} from 'remotion';
import {z} from 'zod';
import {zColor} from '@remotion/zod-types';

export const LogoCompositionComponent: React.FC<{
  config: LogoLiquidOverlayProps; 
}> = ({ config }) => {
  return <LogoLiquidOverlay {...config} />;
};

// ---- UI schema (renders a props form in Remotion Studio/Player)
export const logoLiquidOverlaySchema = z.object({
  text: z.string().min(1).default('SHAKER'),
  durationOutline: z.number().min(0).max(20).default(4), 
  durationFill: z.number().min(0).max(20).default(5), 
  // 💡 NEW PROP: Duration to hold the final state. Defaulted to 2 seconds.
  durationEndPause: z.number().min(0).max(10).default(2),
  baseColor: zColor().default('#FFD700'), // 🎨 color picker
});

export type LogoLiquidOverlayProps = z.infer<typeof logoLiquidOverlaySchema>;

/* =========================
   Color utils (CSS → RGB)
   ========================= */
const clamp255 = (n: number) => Math.max(0, Math.min(255, Math.round(n)));
const hexToRgb = (hex: string) => {
  let h = hex.trim().replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const num = parseInt(h, 16);
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
};
const hslToRgb = (h: number, s: number, l: number) => {
  // h in [0..360], s,l in [0..1]
  const C = (1 - Math.abs(2 * l - 1)) * s;
  const X = C * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - C / 2;
  let r=0, g=0, b=0;
  if (0 <= h && h < 60)   { r = C; g = X; b = 0; }
  else if (60 <= h && h < 120) { r = X; g = C; b = 0; }
  else if (120 <= h && h < 180){ r = 0; g = C; b = X; }
  else if (180 <= h && h < 240){ r = 0; g = X; b = C; }
  else if (240 <= h && h < 300){ r = X; g = 0; b = C; }
  else                         { r = C; g = 0; b = X; }
  return {
    r: clamp255((r + m) * 255),
    g: clamp255((g + m) * 255),
    b: clamp255((b + m) * 255),
  };
};
const cssToRgb = (color: string) => {
  const c = color.trim();

  // Hex
  if (c.startsWith('#')) return hexToRgb(c);

  // rgb/rgba
  const rgb = c.match(/^rgba?\((\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})(?:\s*,\s*(\d*\.?\d+))?\)$/i);
  if (rgb) {
    return {
      r: clamp255(parseInt(rgb[1], 10)),
      g: clamp255(parseInt(rgb[2], 10)),
      b: clamp255(parseInt(rgb[3], 10)),
    };
  }

  // hsl/hsla
  const hsl = c.match(/^hsla?\(\s*(\d{1,3}(?:\.\d+)?)\s*,\s*(\d{1,3})%\s*,\s*(\d{1,3})%(?:\s*,\s*(\d*\.?\d+))?\s*\)$/i);
  if (hsl) {
    const h = parseFloat(hsl[1]);
    const s = parseInt(hsl[2], 10) / 100;
    const l = parseInt(hsl[3], 10) / 100;
    return hslToRgb(h, s, l);
  }

  // Minimal named-color fallback (extend as needed)
  const named: Record<string, string> = {
    red: '#ff0000', green: '#008000', blue: '#0000ff', black: '#000000',
    white: '#ffffff', gold: '#ffd700', teal: '#008080', yellow: '#ffff00',
    orange: '#ffa500', purple: '#800080', pink: '#ffc0cb',
  };
  if (named[c.toLowerCase()]) return hexToRgb(named[c.toLowerCase()]);

  // Safe fallback
  return hexToRgb('#ffffff');
};

const mix = (a: { r: number; g: number; b: number }, b: { r: number; g: number; b: number }, t: number) => ({
  r: clamp255(a.r + (b.r - a.r) * t),
  g: clamp255(a.g + (b.g - a.g) * t),
  b: clamp255(a.b + (b.b - a.b) * t),
});
const toRgba = (c: { r: number; g: number; b: number }, a = 1) => `rgba(${c.r},${c.g},${c.b},${a})`;
const toRgb = (c: { r: number; g: number; b: number }) => `rgb(${c.r},${c.g},${c.b})`;

/* =========================
   Waves, particles (unchanged)
   ========================= */
const generateMultiLayerWave = (width: number, height: number, offset: number, amplitude: number, layers = 3) => {
  const paths: string[] = [];
  for (let layer = 0; layer < layers; layer++) {
    let path = `M 0 ${height}`;
    const frequency = 0.02 + layer * 0.01;
    const phase = (layer * Math.PI) / 3;
    const layerAmplitude = amplitude * (1 - layer * 0.3);
    for (let x = 0; x <= width; x += 8) {
      const wave1 = Math.sin(x * frequency + offset * 0.05 + phase) * layerAmplitude;
      const wave2 = Math.sin(x * frequency * 2 + offset * 0.03 + phase) * (layerAmplitude * 0.3);
      const wave3 = Math.sin(x * frequency * 0.5 + offset * 0.07 + phase) * (layerAmplitude * 0.5);
      const y = height - (wave1 + wave2 + wave3);
      path += ` L ${x} ${y}`;
    }
    path += ` L ${width} ${height} L 0 ${height} Z`;
    paths.push(path);
  }
  return paths;
};

const generateParticles = (count: number, frame: number, width: number, height: number) => {
  const particles: Array<{ x: number; y: number; opacity: number; size: number; seed: number }> = [];
  for (let i = 0; i < count; i++) {
    const seed = i * 137.508;
    const x = (Math.sin(seed) * 0.5 + 0.5) * width;
    const baseY = (Math.cos(seed) * 0.5 + 0.5) * height;
    const floatOffset = Math.sin(frame * 0.02 + seed) * 30;
    const y = baseY + floatOffset;
    const opacity = (Math.sin(frame * 0.03 + seed) * 0.5 + 0.5) * 0.8;
    const size = 2 + (Math.sin(seed * 2) * 0.5 + 0.5) * 3;
    particles.push({ x, y, opacity, size, seed });
  }
  return particles;
};

export const LogoLiquidOverlay: React.FC<LogoLiquidOverlayProps> = ({
  text,
  durationOutline,
  durationFill,
  baseColor,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  const outlineFrames = durationOutline * fps;
  const fillFrames = durationFill * fps;
  // const totalFrames = outlineFrames + fillFrames + durationEndPause * fps; // 💡 Updated total frames

  // All existing interpolations rely on frame counts derived from outlineFrames and fillFrames, 
  // so they automatically complete before the end pause frames are reached.

  const dashOffset = interpolate(frame, [0, outlineFrames * 1.2], [2000, 0], {
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.25, 0.1, 0.25, 1),
  });

  const fillStart = outlineFrames;
  const fillProgress = interpolate(frame, [fillStart, fillStart + fillFrames], [0, 1], {
    extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.cubic),
  });

  const waveSpeed = interpolate(frame, [0, outlineFrames * 0.5, outlineFrames], [0.5, 2, 3], {
    extrapolateRight: 'clamp',
  });
  const waveHeight = height * 0.6 + height * 0.4 * (1 - fillProgress);
  const wavePaths = generateMultiLayerWave(width, height, frame * waveSpeed, 25, 3);

  // ✅ Accept any CSS color string coming from zColor()
  const base = cssToRgb(baseColor);
  const lighter = mix(base, { r: 255, g: 255, b: 255 }, 0.25);
  // const darker = mix(base, { r: 0, g: 0, b: 0 }, 0.35);
  const lighterAnimated = mix(base, { r: 255, g: 255, b: 255 }, 0.15 + fillProgress * 0.25);
  const darkerAnimated = mix(base, { r: 0, g: 0, b: 0 }, 0.2 + fillProgress * 0.2);

  const glowIntensity = interpolate(frame, [0, outlineFrames * 0.3, outlineFrames * 0.8, fillFrames + outlineFrames], [0, 0.4, 0.8, 1.2], {
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.4, 0, 0.6, 1),
  });
  const textScale = interpolate(frame, [0, outlineFrames * 0.5, outlineFrames], [1.05, 0.98, 1], {
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.4, 0, 0.2, 1),
  });
  const particles = generateParticles(50, frame, width, height * 0.4);
  const backgroundPulse = interpolate(Math.sin(frame * 0.05), [-1, 1], [0.9, 1.1]);

  return (
    <AbsoluteFill
      style={{
        justifyContent: 'center',
        alignItems: 'center',
        background: `radial-gradient(ellipse at center, rgba(26,26,26,${backgroundPulse}), #000000)`,
        flexDirection: 'column',
      }}
    >
      {/* Background light rays */}
      <svg width="100%" height="100%" style={{ position: 'absolute', top: 0, left: 0, opacity: fillProgress * 0.3 }}>
        <defs>
          <radialGradient id="lightRay" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={toRgba(lighterAnimated, 0.12)} />
            <stop offset="100%" stopColor={toRgba(lighterAnimated, 0)} />
          </radialGradient>
        </defs>
        <circle
          cx="50%"
          cy="50%"
          r={`${30 + fillProgress * 20}%`}
          fill="url(#lightRay)"
          transform={`rotate(${frame * 0.5} ${width / 2} ${height / 2})`}
        />
      </svg>

      {/* Floating particles */}
      <svg width="100%" height="40%" style={{ position: 'absolute', top: '10%', opacity: fillProgress }}>
        {particles.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={p.size} fill={toRgba(lighterAnimated, p.opacity)} style={{ filter: 'blur(0.5px)' }} />
        ))}
      </svg>

      {/* Main text animation */}
      <svg
        width="85%"
        height="45%"
        viewBox={`0 0 ${width} ${height / 2}`}
        style={{
          filter: `drop-shadow(0 0 ${15 * glowIntensity}px ${toRgba(lighterAnimated, 0.8)})`,
          zIndex: 10,
          transform: `scale(${textScale})`,
        }}
      >
        <defs>
          <linearGradient id="strokeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={toRgb(lighter)} />
            <stop offset="50%" stopColor={toRgb(base)} />
            <stop offset="100%" stopColor={toRgb(lighter)} />
          </linearGradient>

          <linearGradient id="fillGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={toRgba(lighterAnimated, 0.95)} />
            <stop offset="50%" stopColor={toRgba(base, 0.85)} />
            <stop offset="100%" stopColor={toRgba(darkerAnimated, 0.75)} />
          </linearGradient>

          <clipPath id="textClip">
            <text
              x="50%"
              y="50%"
              textAnchor="middle"
              dominantBaseline="middle"
              fontFamily="Arial, sans-serif"
              fontSize={180}
              fontWeight="bold"
            >
              {text}
            </text>
          </clipPath>

          <filter id="textGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation={4 * glowIntensity} result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Outline */}
        <text
          x="50%"
          y="50%"
          textAnchor="middle"
          dominantBaseline="middle"
          fontFamily="Arial, sans-serif"
          fontSize={180}
          fontWeight="bold"
          fill="none"
          stroke="url(#strokeGradient)"
          strokeWidth={3}
          strokeDasharray="2000"
          strokeDashoffset={dashOffset}
          filter="url(#textGlow)"
        >
          {text}
        </text>

        {/* Liquid fill */}
        <g clipPath="url(#textClip)">
          {wavePaths.map((path, index) => {
            const layerShade = mix(base, { r: 0, g: 0, b: 0 }, 0.1 + index * 0.15);
            return (
              <path
                key={index}
                d={path}
                fill={toRgba(layerShade, 0.6 - index * 0.1)}
                transform={`translate(0, ${waveHeight + index * 5})`}
                style={{ mixBlendMode: 'normal' }}
              />
            );
          })}
          {/* Surface highlight */}
          <path
            d={wavePaths[0]}
            fill="none"
            stroke={toRgba(lighterAnimated, 0.8)}
            strokeWidth="2"
            transform={`translate(0, ${waveHeight - 2})`}
            style={{ filter: 'blur(1px)' }}
          />
        </g>

        {/* Final fill overlay */}
        <text
          x="50%"
          y="50%"
          textAnchor="middle"
          dominantBaseline="middle"
          fontFamily="Arial, sans-serif"
          fontSize={180}
          fontWeight="bold"
          fill="url(#fillGradient)"
          opacity={Math.min(fillProgress * 1.5, 1)}
          filter="url(#textGlow)"
          style={{ mixBlendMode: 'multiply' }}
        >
          {text}
        </text>
      </svg>

      {/* Ripples - Ensures radius >= 0 */}
      <svg width="100%" height="100%" style={{ position: 'absolute', opacity: fillProgress * 0.4, pointerEvents: 'none' }}>
        {[...Array(3)].map((_, index) => {
          const localTime = Math.max(0, frame - index * 10);
          const local = localTime % 60;
          // Use [0, 3] range for scale, ensuring it starts at zero size.
          const rippleScale = interpolate(local, [0, 60], [0, 3], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });
          const rippleOpacity = interpolate(local, [0, 60], [0.5, 0], { extrapolateRight: 'clamp' });
          
          // Use Math.max(0, ...) to guarantee a non-negative radius for SVG.
          const radius = Math.max(0, 5 * rippleScale);
          
          return (
            <circle
              key={index}
              cx="50%"
              cy="50%"
              r={`${radius}%`} 
              fill="none"
              stroke={toRgba(lighterAnimated, rippleOpacity)}
              strokeWidth="2"
            />
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};

export default LogoLiquidOverlay;