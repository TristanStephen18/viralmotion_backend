import React from 'react';
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  Easing,
  spring,
  interpolateColors,
} from 'remotion';

interface BackgroundProps {
  type: string;
  backgroundColor: string;
  animation?: string;
}

// Helper for smooth animations
const smoothInterpolate = (frame: number, fps: number, duration: number, outputRange: number[]) => {
  const progress = (frame / (fps * duration)) % 1;
  return interpolate(progress, [0, 1], outputRange, {
    easing: Easing.inOut(Easing.ease),
  });
};

// 1. Ambient Flow - Smooth gradient rotation
const AmbientFlow: React.FC<{ gradient: string }> = ({ gradient }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  
  const progress = (frame / (fps * 10)) % 1;
  const rotation = interpolate(progress, [0, 1], [0, 360]);
  const scale = interpolate(Math.sin(progress * Math.PI * 2), [-1, 1], [1, 1.2]);
  
  return (
    <AbsoluteFill style={{ width, height, overflow: 'hidden' }}>
      <div
        style={{
          position: 'absolute',
          width: '200%',
          height: '200%',
          left: '-50%',
          top: '-50%',
          background: gradient || 'linear-gradient(45deg, #ee7752, #e73c7e, #23a6d5, #23d5ab)',
          transform: `rotate(${rotation}deg) scale(${scale})`,
          filter: 'brightness(1.1)',
        }}
      />
    </AbsoluteFill>
  );
};

// 2. Color Drift - Smooth color interpolation
const ColorDrift: React.FC<{ gradient: string }> = ({ gradient }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const t = frame / fps;
  
  const color1 = interpolateColors(
    Math.sin(t * 0.2) * 0.5 + 0.5,
    [0, 1],
    ['#4158D0', '#C850C0']
  );
  
  const color2 = interpolateColors(
    Math.cos(t * 0.15) * 0.5 + 0.5,
    [0, 1],
    ['#FFCC70', '#FF6B6B']
  );
  
  const angle = 45 + Math.sin(t * 0.1) * 45;
  
  return (
    <AbsoluteFill style={{ width, height }}>
      <div
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          background: `linear-gradient(${angle}deg, ${color1}, ${color2})`,
        }}
      />
    </AbsoluteFill>
  );
};

// 3. Star Field - Minimal twinkling particles
const StarField: React.FC<{ gradient: string }> = ({ gradient }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const stars = 100;
  
  return (
    <AbsoluteFill style={{ width, height, background: gradient || 'linear-gradient(180deg, #0a0e27 0%, #1a237e 100%)' }}>
      {Array.from({ length: stars }).map((_, i) => {
        const x = (i * 61) % 100;
        const y = (i * 31) % 100;
        const size = 0.5 + (i % 3) * 0.5;
        const twinkle = Math.abs(Math.sin((frame / fps) * (1 + i % 5) + i));
        
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `${x}%`,
              top: `${y}%`,
              width: `${size}px`,
              height: `${size}px`,
              backgroundColor: '#ffffff',
              borderRadius: '50%',
              opacity: twinkle * 0.8,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

// 4. Ocean Waves - Abstract wave gradients
const OceanWaves: React.FC<{ gradient: string }> = ({ gradient }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  
  return (
    <AbsoluteFill style={{ width, height, background: gradient || 'linear-gradient(180deg, #0077be 0%, #00a8cc 100%)' }}>
      {[0, 1, 2].map((layer) => {
        const t = (frame / fps) * (0.3 + layer * 0.1);
        const yOffset = 40 + layer * 20;
        const opacity = 0.2 - layer * 0.05;
        
        return (
          <div
            key={layer}
            style={{
              position: 'absolute',
              width: '100%',
              height: '60%',
              bottom: 0,
              background: `linear-gradient(180deg, 
                transparent 0%, 
                rgba(255, 255, 255, ${opacity}) ${yOffset + Math.sin(t) * 10}%, 
                transparent 100%)`,
              transform: `translateY(${Math.sin(t) * 50}px)`,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

// 5. Ambient Spheres - Soft blurred orbs
const AmbientSpheres: React.FC<{ gradient: string }> = ({ gradient }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  
  return (
    <AbsoluteFill style={{ width, height, background: gradient || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      {Array.from({ length: 6 }).map((_, i) => {
        const t = (frame / fps) * 0.1;
        const x = width * (0.5 + Math.sin(t + i * Math.PI / 3) * 0.3);
        const y = height * (0.5 + Math.cos(t * 0.8 + i * Math.PI / 3) * 0.3);
        const size = 300 + Math.sin(t + i) * 100;
        
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `${x}px`,
              top: `${y}px`,
              width: `${size}px`,
              height: `${size}px`,
              transform: 'translate(-50%, -50%)',
              background: `radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 70%)`,
              filter: 'blur(60px)',
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

// 6. Animated Mesh - Gradient mesh animation
const AnimatedMesh: React.FC<{ gradient: string }> = ({ gradient }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'];
  
  return (
    <AbsoluteFill style={{ width, height, background: gradient || 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)' }}>
      {colors.map((color, i) => {
        const t = (frame / fps) * 0.15;
        const x = width * (0.5 + Math.sin(t + i * 0.7) * 0.4);
        const y = height * (0.5 + Math.cos(t * 0.6 + i * 0.7) * 0.4);
        const size = 400 + Math.sin(t + i) * 100;
        
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `${x}px`,
              top: `${y}px`,
              width: `${size}px`,
              height: `${size}px`,
              transform: 'translate(-50%, -50%)',
              background: color,
              borderRadius: '50%',
              opacity: 0.2,
              filter: 'blur(80px)',
              mixBlendMode: 'screen',
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

// 7. Sunset Gradient - Warm gradient animation (not literal sunset)
const SunsetGradient: React.FC<{ gradient: string }> = ({ gradient }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const t = frame / fps;
  
  const color1 = interpolateColors(
    Math.sin(t * 0.1) * 0.5 + 0.5,
    [0, 1],
    ['#FF6B6B', '#FF8E53']
  );
  
  const color2 = interpolateColors(
    Math.cos(t * 0.08) * 0.5 + 0.5,
    [0, 1],
    ['#FFA500', '#FFD700']
  );
  
  const color3 = interpolateColors(
    Math.sin(t * 0.12) * 0.5 + 0.5,
    [0, 1],
    ['#FF6347', '#FF7F50']
  );
  
  return (
    <AbsoluteFill style={{ width, height }}>
      <div
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          background: `linear-gradient(180deg, ${color1} 0%, ${color2} 50%, ${color3} 100%)`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          background: `radial-gradient(ellipse at center bottom, 
            rgba(255, 215, 0, ${0.2 + Math.sin(t * 0.5) * 0.1}) 0%, 
            transparent 70%)`,
        }}
      />
    </AbsoluteFill>
  );
};

// 8. Night Gradient - Deep blue gradient animation
const NightGradient: React.FC<{ gradient: string }> = ({ gradient }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const t = frame / fps;
  
  const color1 = interpolateColors(
    Math.sin(t * 0.05) * 0.5 + 0.5,
    [0, 1],
    ['#0f0c29', '#24243e']
  );
  
  const color2 = interpolateColors(
    Math.cos(t * 0.07) * 0.5 + 0.5,
    [0, 1],
    ['#302b63', '#1a237e']
  );
  
  return (
    <AbsoluteFill style={{ width, height }}>
      <div
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          background: `linear-gradient(135deg, ${color1} 0%, ${color2} 100%)`,
        }}
      />
      {/* Subtle particles */}
      {Array.from({ length: 50 }).map((_, i) => {
        const x = (i * 37) % 100;
        const y = (i * 23) % 100;
        const opacity = 0.3 + Math.sin((frame / fps) * 2 + i) * 0.2;
        
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `${x}%`,
              top: `${y}%`,
              width: '1px',
              height: '1px',
              backgroundColor: '#ffffff',
              opacity,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

// 9. Storm Gradient - Moody gradient animation
const StormGradient: React.FC<{ gradient: string }> = ({ gradient }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const t = frame / fps;
  
  const color1 = interpolateColors(
    Math.sin(t * 0.08) * 0.5 + 0.5,
    [0, 1],
    ['#2C3E50', '#34495E']
  );
  
  const color2 = interpolateColors(
    Math.cos(t * 0.06) * 0.5 + 0.5,
    [0, 1],
    ['#1C2833', '#2C3E50']
  );
  
  return (
    <AbsoluteFill style={{ width, height }}>
      <div
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          background: `linear-gradient(180deg, ${color1} 0%, ${color2} 100%)`,
        }}
      />
      {/* Moving gradient layers */}
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            background: `linear-gradient(90deg, 
              transparent, 
              rgba(52, 73, 94, ${0.2 - i * 0.05}), 
              transparent)`,
            transform: `translateX(${Math.sin(t * 0.3 + i) * 200}px)`,
          }}
        />
      ))}
    </AbsoluteFill>
  );
};

// 10. Nature Gradient - Fresh green gradient animation
const NatureGradient: React.FC<{ gradient: string }> = ({ gradient }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const t = frame / fps;
  
  const color1 = interpolateColors(
    Math.sin(t * 0.1) * 0.5 + 0.5,
    [0, 1],
    ['#56ab2f', '#76b852']
  );
  
  const color2 = interpolateColors(
    Math.cos(t * 0.08) * 0.5 + 0.5,
    [0, 1],
    ['#a8e063', '#8BC34A']
  );
  
  return (
    <AbsoluteFill style={{ width, height }}>
      <div
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          background: `linear-gradient(135deg, ${color1} 0%, ${color2} 100%)`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          background: `radial-gradient(circle at ${50 + Math.sin(t * 0.2) * 30}% 50%, 
            rgba(255, 255, 255, 0.1) 0%, 
            transparent 60%)`,
        }}
      />
    </AbsoluteFill>
  );
};

// 11. Gradient Pulse - Rhythmic gradient pulses
const GradientPulse: React.FC<{ gradient: string }> = ({ gradient }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const t = frame / fps;
  const pulse = Math.sin(t) * 0.5 + 0.5;
  
  return (
    <AbsoluteFill style={{ width, height }}>
      <div
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          background: gradient || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          opacity: 0.7 + pulse * 0.3,
        }}
      />
      <div
        style={{
          position: 'absolute',
          width: '150%',
          height: '150%',
          left: '-25%',
          top: '-25%',
          background: 'radial-gradient(circle, rgba(255,255,255,0.2) 0%, transparent 70%)',
          transform: `scale(${1 + pulse * 0.5})`,
          opacity: 1 - pulse,
        }}
      />
    </AbsoluteFill>
  );
};

// 12. Fluid Motion - Smooth fluid animation
const FluidMotion: React.FC<{ gradient: string }> = ({ gradient }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  
  return (
    <AbsoluteFill style={{ width, height, background: gradient || 'linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%)' }}>
      <svg width="100%" height="100%" style={{ filter: 'blur(40px)' }}>
        {Array.from({ length: 5 }).map((_, i) => {
          const t = (frame / fps) * 0.3;
          const cx = 50 + Math.sin(t + i * Math.PI / 2.5) * 30;
          const cy = 50 + Math.cos(t * 0.7 + i * Math.PI / 2.5) * 30;
          const r = 20 + Math.sin(t * 2 + i) * 10;
          
          return (
            <circle
              key={i}
              cx={`${cx}%`}
              cy={`${cy}%`}
              r={`${r}%`}
              fill="rgba(255, 255, 255, 0.3)"
            />
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};

// 13. Particle Flow - Elegant particle system
const ParticleFlow: React.FC<{ gradient: string }> = ({ gradient }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const particles = 80;
  
  return (
    <AbsoluteFill style={{ width, height, background: gradient || 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
      {Array.from({ length: particles }).map((_, i) => {
        const t = (frame / fps) * 2;
        const x = (i * 31) % 100;
        const y = ((t * 20 + i * 10) % 110) - 5;
        const size = 1 + (i % 3);
        const opacity = y > 10 && y < 90 ? 0.6 : 0;
        
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `${x}%`,
              top: `${y}%`,
              width: `${size}px`,
              height: `${size}px`,
              backgroundColor: 'rgba(255, 255, 255, 0.8)',
              borderRadius: '50%',
              opacity,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

// 14. Minimal Waves - Clean wave animation
const MinimalWaves: React.FC<{ gradient: string }> = ({ gradient }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const t = frame / fps;
  
  return (
    <AbsoluteFill style={{ width, height, background: gradient || 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)' }}>
      {[0, 1, 2].map((i) => {
        const offset = i * 0.3;
        const wave = Math.sin(t * 0.5 + offset) * 50;
        
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              background: `linear-gradient(180deg, 
                transparent ${40 + wave}%, 
                rgba(255, 255, 255, ${0.1 - i * 0.03}) ${50 + wave}%, 
                transparent ${60 + wave}%)`,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

// 15. Soft Glow - Gentle glowing orbs
const SoftGlow: React.FC<{ gradient: string }> = ({ gradient }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const t = frame / fps;
  
  return (
    <AbsoluteFill style={{ width, height, background: gradient || 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)' }}>
      {Array.from({ length: 4 }).map((_, i) => {
        const x = 25 + (i % 2) * 50;
        const y = 25 + Math.floor(i / 2) * 50;
        const pulse = Math.sin(t + i * Math.PI / 2) * 0.5 + 0.5;
        
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `${x}%`,
              top: `${y}%`,
              width: '300px',
              height: '300px',
              transform: 'translate(-50%, -50%)',
              background: 'radial-gradient(circle, rgba(255, 255, 255, 0.3) 0%, transparent 70%)',
              filter: 'blur(50px)',
              opacity: 0.5 + pulse * 0.3,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

// 16. Geometric Flow - Minimal geometric animation
const GeometricFlow: React.FC<{ gradient: string }> = ({ gradient }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const t = frame / fps;
  
  return (
    <AbsoluteFill style={{ width, height, background: gradient || 'linear-gradient(135deg, #3f2b96 0%, #a8c0ff 100%)' }}>
      {Array.from({ length: 8 }).map((_, i) => {
        const angle = (360 / 8) * i + t * 20;
        const distance = 150 + Math.sin(t + i * 0.5) * 50;
        const x = 50 + Math.cos((angle * Math.PI) / 180) * (distance / 3);
        const y = 50 + Math.sin((angle * Math.PI) / 180) * (distance / 3);
        
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `${x}%`,
              top: `${y}%`,
              width: '30px',
              height: '30px',
              transform: 'translate(-50%, -50%)',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              borderRadius: i % 2 === 0 ? '50%' : '0%',
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

// 17. Color Waves - Flowing color waves
const ColorWaves: React.FC<{ gradient: string }> = ({ gradient }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const t = frame / fps;
  
  return (
    <AbsoluteFill style={{ width, height, background: gradient || 'linear-gradient(135deg, #FA8BFF 0%, #2BD2FF 100%)' }}>
      {[0, 1, 2, 3].map((i) => {
        const hue = (i * 90 + t * 30) % 360;
        const y = 25 * (i + 1);
        const wave = Math.sin(t * 0.5 + i * 0.5) * 20;
        
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              width: '100%',
              height: '25%',
              top: `${y + wave}%`,
              background: `linear-gradient(90deg, 
                transparent, 
                hsla(${hue}, 70%, 60%, 0.2), 
                transparent)`,
              transform: `skewY(${Math.sin(t + i) * 3}deg)`,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

// 18. Ambient Dots - Floating dot matrix
const AmbientDots: React.FC<{ gradient: string }> = ({ gradient }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const gridSize = 10;
  
  return (
    <AbsoluteFill style={{ width, height, background: gradient || 'linear-gradient(135deg, #ee9ca7 0%, #ffdde1 100%)' }}>
      {Array.from({ length: gridSize * gridSize }).map((_, i) => {
        const x = (i % gridSize) * 10 + 5;
        const y = Math.floor(i / gridSize) * 10 + 5;
        const t = (frame / fps) * 2;
        const wave = Math.sin(t + x * 0.1 + y * 0.1) * 0.5 + 0.5;
        
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `${x}%`,
              top: `${y}%`,
              width: '4px',
              height: '4px',
              backgroundColor: 'rgba(255, 255, 255, 0.5)',
              borderRadius: '50%',
              transform: 'translate(-50%, -50%)',
              opacity: wave,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

// 19. Gradient Shift - Smooth gradient transitions
const GradientShift: React.FC<{ gradient: string }> = ({ gradient }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const t = frame / fps;
  
  const hue1 = (t * 20) % 360;
  const hue2 = (t * 20 + 120) % 360;
  const hue3 = (t * 20 + 240) % 360;
  
  return (
    <AbsoluteFill style={{ width, height }}>
      <div
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          background: `linear-gradient(135deg, 
            hsl(${hue1}, 70%, 60%), 
            hsl(${hue2}, 70%, 60%), 
            hsl(${hue3}, 70%, 60%))`,
        }}
      />
    </AbsoluteFill>
  );
};

// 20. Ethereal Mist - Soft misty animation
const EtherealMist: React.FC<{ gradient: string }> = ({ gradient }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const t = frame / fps;
  
  return (
    <AbsoluteFill style={{ width, height, background: gradient || 'linear-gradient(135deg, #c2e9fb 0%, #a1c4fd 100%)' }}>
      {Array.from({ length: 5 }).map((_, i) => {
        const x = Math.sin(t * 0.2 + i) * 20;
        const y = 20 + i * 20;
        const scale = 1.5 + Math.sin(t * 0.3 + i) * 0.5;
        
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `${50 + x}%`,
              top: `${y}%`,
              width: '60%',
              height: '100px',
              transform: `translateX(-50%) scaleX(${scale})`,
              background: 'radial-gradient(ellipse, rgba(255, 255, 255, 0.2), transparent)',
              filter: 'blur(40px)',
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

// 21. Pulse Edge Glow - Pulsing border glow effect
const PulseEdgeGlow: React.FC<{ gradient: string }> = ({ gradient }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const t = frame / fps;
  const pulse = Math.sin(t * 2) * 0.5 + 0.5;
  
  return (
    <AbsoluteFill style={{ width, height, background: gradient || 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)' }}>
      {/* Top edge */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '100px',
          background: `linear-gradient(180deg, 
            rgba(0, 255, 255, ${0.3 + pulse * 0.4}) 0%, 
            transparent 100%)`,
          filter: 'blur(20px)',
        }}
      />
      {/* Bottom edge */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '100px',
          background: `linear-gradient(0deg, 
            rgba(0, 255, 255, ${0.3 + pulse * 0.4}) 0%, 
            transparent 100%)`,
          filter: 'blur(20px)',
        }}
      />
      {/* Left edge */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: 0,
          width: '100px',
          background: `linear-gradient(90deg, 
            rgba(0, 255, 255, ${0.3 + pulse * 0.4}) 0%, 
            transparent 100%)`,
          filter: 'blur(20px)',
        }}
      />
      {/* Right edge */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          right: 0,
          width: '100px',
          background: `linear-gradient(270deg, 
            rgba(0, 255, 255, ${0.3 + pulse * 0.4}) 0%, 
            transparent 100%)`,
          filter: 'blur(20px)',
        }}
      />
      {/* Inner pulse layer */}
      <div
        style={{
          position: 'absolute',
          top: '2px',
          left: '2px',
          right: '2px',
          bottom: '2px',
          border: `2px solid rgba(0, 255, 255, ${0.2 + pulse * 0.3})`,
          borderRadius: '4px',
          boxShadow: `inset 0 0 ${30 + pulse * 20}px rgba(0, 255, 255, 0.3)`,
        }}
      />
    </AbsoluteFill>
  );
};

// 22. Rotating Edge Glow - Traveling glow around edges
const RotatingEdgeGlow: React.FC<{ gradient: string }> = ({ gradient }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const t = (frame / fps) * 0.5;
  const progress = t % 4;
  
  // Calculate position along perimeter
  const perimeter = 2 * (width + height);
  const currentPosition = (progress / 4) * perimeter;
  
  let glowX = 0, glowY = 0;
  if (currentPosition < width) {
    glowX = currentPosition;
    glowY = 0;
  } else if (currentPosition < width + height) {
    glowX = width;
    glowY = currentPosition - width;
  } else if (currentPosition < 2 * width + height) {
    glowX = width - (currentPosition - width - height);
    glowY = height;
  } else {
    glowX = 0;
    glowY = height - (currentPosition - 2 * width - height);
  }
  
  return (
    <AbsoluteFill style={{ width, height, background: gradient || 'linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 100%)' }}>
      {/* Static dim border */}
      <div
        style={{
          position: 'absolute',
          top: '0',
          left: '0',
          right: '0',
          bottom: '0',
          border: '1px solid rgba(255, 0, 255, 0.2)',
          borderRadius: '4px',
        }}
      />
      {/* Traveling glow */}
      <div
        style={{
          position: 'absolute',
          left: `${glowX}px`,
          top: `${glowY}px`,
          width: '200px',
          height: '200px',
          transform: 'translate(-50%, -50%)',
          background: 'radial-gradient(circle, rgba(255, 0, 255, 0.8) 0%, transparent 70%)',
          filter: 'blur(40px)',
          pointerEvents: 'none',
        }}
      />
      {/* Secondary traveling glow (opposite side) */}
      <div
        style={{
          position: 'absolute',
          left: `${width - glowX}px`,
          top: `${height - glowY}px`,
          width: '200px',
          height: '200px',
          transform: 'translate(-50%, -50%)',
          background: 'radial-gradient(circle, rgba(0, 255, 255, 0.8) 0%, transparent 70%)',
          filter: 'blur(40px)',
          pointerEvents: 'none',
        }}
      />
    </AbsoluteFill>
  );
};

// 23. Corner Sweep Glow - Sweeping glow from corner to corner
const CornerSweepGlow: React.FC<{ gradient: string }> = ({ gradient }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const t = frame / fps;
  const cycle = t % 4;
  
  const corners = [
    { x: 0, y: 0 },           // Top-left
    { x: width, y: 0 },       // Top-right
    { x: width, y: height },  // Bottom-right
    { x: 0, y: height },      // Bottom-left
  ];
  
  const currentCorner = Math.floor(cycle);
  const nextCorner = (currentCorner + 1) % 4;
  const progress = cycle - currentCorner;
  
  const x = corners[currentCorner].x + (corners[nextCorner].x - corners[currentCorner].x) * progress;
  const y = corners[currentCorner].y + (corners[nextCorner].y - corners[currentCorner].y) * progress;
  
  return (
    <AbsoluteFill style={{ width, height, background: gradient || 'linear-gradient(135deg, #0a0a0a 0%, #1e1e1e 100%)' }}>
      {/* Corner highlights */}
      {corners.map((corner, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: `${corner.x}px`,
            top: `${corner.y}px`,
            width: '100px',
            height: '100px',
            transform: 'translate(-50%, -50%)',
            background: 'radial-gradient(circle, rgba(100, 200, 255, 0.3) 0%, transparent 70%)',
            filter: 'blur(30px)',
          }}
        />
      ))}
      {/* Moving sweep glow */}
      <div
        style={{
          position: 'absolute',
          left: `${x}px`,
          top: `${y}px`,
          width: '300px',
          height: '300px',
          transform: 'translate(-50%, -50%)',
          background: 'radial-gradient(circle, rgba(100, 200, 255, 0.8) 0%, transparent 60%)',
          filter: 'blur(40px)',
        }}
      />
      {/* Trail effect */}
      <div
        style={{
          position: 'absolute',
          left: `${x}px`,
          top: `${y}px`,
          width: '150px',
          height: '150px',
          transform: 'translate(-50%, -50%)',
          background: 'radial-gradient(circle, rgba(255, 255, 255, 0.5) 0%, transparent 50%)',
          filter: 'blur(20px)',
        }}
      />
      {/* Border frame */}
      <div
        style={{
          position: 'absolute',
          top: '0',
          left: '0',
          right: '0',
          bottom: '0',
          border: '1px solid rgba(100, 200, 255, 0.2)',
          borderRadius: '4px',
        }}
      />
    </AbsoluteFill>
  );
};

// 24. Edge Wave Glow - Wave effect along edges
const EdgeWaveGlow: React.FC<{ gradient: string }> = ({ gradient }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const t = frame / fps;
  
  return (
    <AbsoluteFill style={{ width, height, background: gradient || 'linear-gradient(135deg, #0f0c29 0%, #302b63 100%)' }}>
      {/* Top edge wave */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '80px',
          background: `linear-gradient(180deg, 
            rgba(138, 43, 226, ${0.3 + Math.sin(t * 2) * 0.2}) 0%, 
            transparent 100%)`,
          filter: 'blur(15px)',
          transform: `translateY(${Math.sin(t * 2) * 10}px)`,
        }}
      />
      {/* Bottom edge wave */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '80px',
          background: `linear-gradient(0deg, 
            rgba(138, 43, 226, ${0.3 + Math.sin(t * 2 + Math.PI) * 0.2}) 0%, 
            transparent 100%)`,
          filter: 'blur(15px)',
          transform: `translateY(${-Math.sin(t * 2 + Math.PI) * 10}px)`,
        }}
      />
      {/* Left edge wave */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: 0,
          width: '80px',
          background: `linear-gradient(90deg, 
            rgba(138, 43, 226, ${0.3 + Math.sin(t * 2 + Math.PI/2) * 0.2}) 0%, 
            transparent 100%)`,
          filter: 'blur(15px)',
          transform: `translateX(${Math.sin(t * 2 + Math.PI/2) * 10}px)`,
        }}
      />
      {/* Right edge wave */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          right: 0,
          width: '80px',
          background: `linear-gradient(270deg, 
            rgba(138, 43, 226, ${0.3 + Math.sin(t * 2 - Math.PI/2) * 0.2}) 0%, 
            transparent 100%)`,
          filter: 'blur(15px)',
          transform: `translateX(${-Math.sin(t * 2 - Math.PI/2) * 10}px)`,
        }}
      />
      {/* Wave lines */}
      {Array.from({ length: 8 }).map((_, i) => {
        const offset = (i / 8) * Math.PI * 2;
        const intensity = Math.sin(t * 3 + offset) * 0.5 + 0.5;
        
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              top: '0',
              left: '0',
              right: '0',
              bottom: '0',
              border: `1px solid rgba(138, 43, 226, ${intensity * 0.3})`,
              borderRadius: '4px',
              transform: `scale(${1 - i * 0.01})`,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

// 25. Neon Border Glow - Multi-color neon border animation
const NeonBorderGlow: React.FC<{ gradient: string }> = ({ gradient }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const t = frame / fps;
  
  const color1 = interpolateColors(
    Math.sin(t * 0.5) * 0.5 + 0.5,
    [0, 1],
    ['#FF006E', '#8338EC']
  );
  
  const color2 = interpolateColors(
    Math.cos(t * 0.5) * 0.5 + 0.5,
    [0, 1],
    ['#FB5607', '#3A86FF']
  );
  
  const color3 = interpolateColors(
    Math.sin(t * 0.5 + Math.PI/2) * 0.5 + 0.5,
    [0, 1],
    ['#FFBE0B', '#06FFB4']
  );
  
  return (
    <AbsoluteFill style={{ width, height, background: gradient || 'linear-gradient(135deg, #0a0a0a 0%, #1a0033 100%)' }}>
      {/* Multi-layer neon borders */}
      <div
        style={{
          position: 'absolute',
          top: '10px',
          left: '10px',
          right: '10px',
          bottom: '10px',
          border: `2px solid ${color1}`,
          borderRadius: '8px',
          boxShadow: `
            0 0 10px ${color1},
            0 0 20px ${color1},
            0 0 30px ${color1},
            inset 0 0 10px ${color1}
          `,
          opacity: 0.8,
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: '15px',
          left: '15px',
          right: '15px',
          bottom: '15px',
          border: `1px solid ${color2}`,
          borderRadius: '6px',
          boxShadow: `
            0 0 5px ${color2},
            0 0 15px ${color2},
            inset 0 0 5px ${color2}
          `,
          opacity: 0.6,
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: '20px',
          left: '20px',
          right: '20px',
          bottom: '20px',
          border: `1px solid ${color3}`,
          borderRadius: '4px',
          boxShadow: `
            0 0 3px ${color3},
            0 0 10px ${color3}
          `,
          opacity: 0.4,
        }}
      />
      {/* Flickering effect */}
      {Math.random() > 0.98 && (
        <div
          style={{
            position: 'absolute',
            top: '0',
            left: '0',
            right: '0',
            bottom: '0',
            border: `3px solid rgba(255, 255, 255, 0.8)`,
            borderRadius: '8px',
            filter: 'blur(4px)',
            animation: 'flicker 0.1s',
          }}
        />
      )}
      {/* Corner accents */}
      {[
        { top: 0, left: 0 },
        { top: 0, right: 0 },
        { bottom: 0, left: 0 },
        { bottom: 0, right: 0 },
      ].map((pos, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            ...pos,
            width: '60px',
            height: '60px',
            background: `radial-gradient(circle, ${i % 2 === 0 ? color1 : color2} 0%, transparent 70%)`,
            filter: 'blur(20px)',
            opacity: 0.5 + Math.sin(t * 2 + i * Math.PI/2) * 0.3,
          }}
        />
      ))}
    </AbsoluteFill>
  );
};

// Main animated background component
export const AnimatedBackground: React.FC<BackgroundProps> = ({
  type,
  backgroundColor,
  animation,
}) => {
  const backgroundMap: { [key: string]: React.ReactElement } = {
    'ambient-flow': <AmbientFlow gradient={backgroundColor} />,
    'color-drift': <ColorDrift gradient={backgroundColor} />,
    'star-field': <StarField gradient={backgroundColor} />,
    'ocean-waves': <OceanWaves gradient={backgroundColor} />,
    'ambient-spheres': <AmbientSpheres gradient={backgroundColor} />,
    'animated-mesh': <AnimatedMesh gradient={backgroundColor} />,
    'sunset-gradient': <SunsetGradient gradient={backgroundColor} />,
    'night-gradient': <NightGradient gradient={backgroundColor} />,
    'storm-gradient': <StormGradient gradient={backgroundColor} />,
    'nature-gradient': <NatureGradient gradient={backgroundColor} />,
    'gradient-pulse': <GradientPulse gradient={backgroundColor} />,
    'fluid-motion': <FluidMotion gradient={backgroundColor} />,
    'particle-flow': <ParticleFlow gradient={backgroundColor} />,
    'minimal-waves': <MinimalWaves gradient={backgroundColor} />,
    'soft-glow': <SoftGlow gradient={backgroundColor} />,
    'geometric-flow': <GeometricFlow gradient={backgroundColor} />,
    'color-waves': <ColorWaves gradient={backgroundColor} />,
    'ambient-dots': <AmbientDots gradient={backgroundColor} />,
    'gradient-shift': <GradientShift gradient={backgroundColor} />,
    'ethereal-mist': <EtherealMist gradient={backgroundColor} />,
    'pulse-edge-glow': <PulseEdgeGlow gradient={backgroundColor} />,
    'rotating-edge-glow': <RotatingEdgeGlow gradient={backgroundColor} />,
    'corner-sweep-glow': <CornerSweepGlow gradient={backgroundColor} />,
    'edge-wave-glow': <EdgeWaveGlow gradient={backgroundColor} />,
    'neon-border-glow': <NeonBorderGlow gradient={backgroundColor} />,
  };

  if (type === 'animated' && animation && backgroundMap[animation]) {
    return backgroundMap[animation];
  }
  
  if (type === 'gradient') {
    return <AbsoluteFill style={{ background: backgroundColor }} />;
  }
  
  return <AbsoluteFill style={{ backgroundColor: backgroundColor || '#1a1a2e' }} />;
};

// Demo component
export default function BackgroundShowcase() {
  const animations = [
    { name: 'ambient-flow', gradient: 'linear-gradient(45deg, #ee7752, #e73c7e, #23a6d5, #23d5ab)' },
    { name: 'color-drift', gradient: 'linear-gradient(135deg, #4158D0 0%, #C850C0 100%)' },
    { name: 'star-field', gradient: 'linear-gradient(180deg, #0a0e27 0%, #1a237e 100%)' },
    { name: 'ocean-waves', gradient: 'linear-gradient(180deg, #0077be 0%, #00a8cc 100%)' },
    { name: 'ambient-spheres', gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
    { name: 'animated-mesh', gradient: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)' },
    { name: 'sunset-gradient', gradient: 'linear-gradient(180deg, #FF6B6B 0%, #FFD700 100%)' },
    { name: 'night-gradient', gradient: 'linear-gradient(135deg, #0f0c29 0%, #302b63 100%)' },
    { name: 'storm-gradient', gradient: 'linear-gradient(180deg, #2C3E50 0%, #34495E 100%)' },
    { name: 'nature-gradient', gradient: 'linear-gradient(135deg, #56ab2f 0%, #a8e063 100%)' },
    { name: 'gradient-pulse', gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
    { name: 'fluid-motion', gradient: 'linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%)' },
    { name: 'particle-flow', gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
    { name: 'minimal-waves', gradient: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)' },
    { name: 'soft-glow', gradient: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)' },
    { name: 'geometric-flow', gradient: 'linear-gradient(135deg, #3f2b96 0%, #a8c0ff 100%)' },
    { name: 'color-waves', gradient: 'linear-gradient(135deg, #FA8BFF 0%, #2BD2FF 100%)' },
    { name: 'ambient-dots', gradient: 'linear-gradient(135deg, #ee9ca7 0%, #ffdde1 100%)' },
    { name: 'gradient-shift', gradient: 'linear-gradient(135deg, #FF6B6B 0%, #4ECDC4 100%)' },
    { name: 'ethereal-mist', gradient: 'linear-gradient(135deg, #c2e9fb 0%, #a1c4fd 100%)' },
    { name: 'pulse-edge-glow', gradient: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)' },
    { name: 'rotating-edge-glow', gradient: 'linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 100%)' },
    { name: 'corner-sweep-glow', gradient: 'linear-gradient(135deg, #0a0a0a 0%, #1e1e1e 100%)' },
    { name: 'edge-wave-glow', gradient: 'linear-gradient(135deg, #0f0c29 0%, #302b63 100%)' },
    { name: 'neon-border-glow', gradient: 'linear-gradient(135deg, #0a0a0a 0%, #1a0033 100%)' },
  ];
  
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const currentIndex = Math.floor((frame / (fps * 3)) % animations.length);
  const current = animations[currentIndex];
  
  return (
    <div style={{ position: 'relative', width: '100%', height: '100vh' }}>
      <AnimatedBackground
        type="animated"
        backgroundColor={current.gradient}
        animation={current.name}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '40px',
          left: '50%',
          transform: 'translateX(-50%)',
          color: 'white',
          fontSize: '24px',
          fontWeight: 'bold',
          textShadow: '0 2px 10px rgba(0,0,0,0.5)',
          backgroundColor: 'rgba(0,0,0,0.3)',
          padding: '10px 20px',
          borderRadius: '10px',
          backdropFilter: 'blur(10px)',
        }}
      >
        {current.name.replace(/-/g, ' ').toUpperCase()}
      </div>
    </div>
  );
}