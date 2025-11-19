import React from 'react';
import { useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion';

export interface TypographyConfig {
  id: string;
  words: string[];
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
  timing: {
    staggerDelay: number;
    collisionFrame: number;
    explosionDelay: number;
  };
  effects: {
    shakeIntensity: number;
    particleCount: number;
    ballSize: number;
  };
}

interface KineticTypographyIntroProps extends Record<string, unknown> {
  config: TypographyConfig;
}

const hexToRgba = (hex: string, alpha: number = 1): string => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export const KineticTypographyIntro: React.FC<KineticTypographyIntroProps> = ({ config }) => {
  const frame = useCurrentFrame();
  
  // --- THIS IS THE FIX ---
  // Get width and height from the hook, not just fps
  const { fps, width, height } = useVideoConfig();
  // -----------------------
  
  // Extract configuration values
  const { words, colors, timing, effects } = config;
  const { staggerDelay, collisionFrame, explosionDelay } = timing;
  const explosionFrame = collisionFrame + explosionDelay;
  const totalDuration = fps * 6;
  
  // Spring configuration for premium feel
  const springConfig = {
    fps,
    damping: 15,
    mass: 1.2,
    stiffness: 120,
    overshootClamping: false
  };
  
  const explosionSpringConfig = {
    fps,
    damping: 18,
    mass: 1.5,
    stiffness: 140,
    overshootClamping: false
  };
  
  // Dynamic background gradient using primary color
  // const primaryHsl = hexToHsl(colors.primary);
  const bgRotation = interpolate(frame, [0, totalDuration], [0, 360], {
    extrapolateRight: 'clamp'
  });
  
  // Global scale bloom effect
  const globalScale = interpolate(frame, [collisionFrame - 5, collisionFrame + 10, explosionFrame + 15], [1, 0.2, 1.05], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp'
  });
  
  
  
  // const ballExplosion = spring({
  //   frame: frame - explosionFrame,
  //   ...explosionSpringConfig
  // });
  
  // Ball energy effects
  const ballPulse = Math.sin(frame * 0.5) * 0.3 + 0.7;
  const ballRotation = interpolate(frame, [collisionFrame, explosionFrame], [0, 720], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp'
  });
  
  // Screen shake during collision and explosion - ensure no frame overlaps
  const shakeEnd1 = Math.min(collisionFrame + 8, explosionFrame - 4);
  const shakeStart2 = Math.max(shakeEnd1 + 1, explosionFrame - 2);
  const shakeEnd2 = explosionFrame + 10;
  
  const shakeIntensity = interpolate(frame, [collisionFrame - 2, shakeEnd1, shakeStart2, shakeEnd2], [0, effects.shakeIntensity, 0, effects.shakeIntensity * 1.5], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp'
  });
  
  const shakeX = (Math.random() - 0.5) * shakeIntensity;
  const shakeY = (Math.random() - 0.5) * shakeIntensity;
  
  // Dynamic entry directions based on word count
  const generateEntryDirections = (wordCount: number) => {
    const directions = [];
    const angleStep = (Math.PI * 2) / wordCount;
    
    for (let i = 0; i < wordCount; i++) {
      const angle = i * angleStep - Math.PI / 2; // Start from top
      const distance = 800;
      directions.push({
        x: Math.cos(angle) * distance,
        y: Math.sin(angle) * distance
      });
    }
    return directions;
  };
  
  // Dynamic final positions for different word counts
  const generateFinalPositions = (wordCount: number) => {
    if (wordCount === 1) {
      return [{ x: 0, y: 0 }];
    } else if (wordCount === 2) {
      return [
        { x: 0, y: -15 },
        { x: 0, y: 15 }
      ];
    } else if (wordCount === 3) {
      return [
        { x: 0, y: -30 },
        { x: 0, y: 0 },
        { x: 0, y: 30 }
      ];
    } else {
      // For more words, arrange in a grid
      const positions = [];
      const rows = Math.ceil(wordCount / 2);
      const startY = -(rows - 1) * 20;
      
      for (let i = 0; i < wordCount; i++) {
        const row = Math.floor(i / 2);
        const col = i % 2;
        positions.push({
          x: col === 0 ? (wordCount % 2 === 1 && i === wordCount - 1 ? 0 : -10) : 10,
          y: startY + row * 40
        });
      }
      return positions;
    }
  };
  
  const entryDirections = generateEntryDirections(words.length);
  const finalPositions = generateFinalPositions(words.length);
  
  // Word animation function with collision mechanics
  const getWordAnimation = (wordIndex: number) => {
    const startFrame = wordIndex * staggerDelay;
    const initialProgress = spring({
      frame: frame - startFrame,
      ...springConfig
    });
    
    const explosionProgress = spring({
      frame: frame - explosionFrame,
      ...explosionSpringConfig
    });
    
    const direction = entryDirections[wordIndex];
    const finalPos = finalPositions[wordIndex];
    
    // Phase 1: Entry to collision point
    const entryX = interpolate(initialProgress, [0, 1], [direction.x, 0], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp'
    });
    
    const entryY = interpolate(initialProgress, [0, 1], [direction.y, 0], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp'
    });
    
    // Phase 2: Explosion to final position
    const explosionX = interpolate(explosionProgress, [0, 1], [0, finalPos.x], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp'
    });
    
    const explosionY = interpolate(explosionProgress, [0, 1], [0, finalPos.y], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp'
    });
    
    // Determine current position based on animation phase
    let currentX, currentY, currentOpacity, currentScale;
    
    if (frame < collisionFrame) {
      currentX = entryX;
      currentY = entryY;
      currentOpacity = interpolate(initialProgress, [0, 0.3, 1], [0, 1, 1], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp'
      });
      currentScale = 1;
    } else if (frame < explosionFrame) {
      const collisionProgress = interpolate(frame, [collisionFrame, explosionFrame], [0, 1], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp'
      });
      currentX = 0;
      currentY = 0;
      currentOpacity = interpolate(collisionProgress, [0, 0.5, 1], [1, 0, 0]);
      currentScale = interpolate(collisionProgress, [0, 1], [1, 0.1]);
    } else {
      currentX = explosionX;
      currentY = explosionY;
      currentOpacity = interpolate(explosionProgress, [0, 0.3, 1], [0, 1, 1], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp'
      });
      currentScale = interpolate(explosionProgress, [0, 0.5, 1], [0.2, 1.2, 1], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp'
      });
    }
    
    // Micro wobbles for final position
    const wobbleX = frame > explosionFrame + 20 ? Math.sin((frame - explosionFrame) * 0.1) * 0.5 : 0;
    const wobbleY = frame > explosionFrame + 20 ? Math.cos((frame - explosionFrame) * 0.08) * 0.3 : 0;
    
    return {
      transform: `translate(${currentX + wobbleX}px, ${currentY + wobbleY}px) scale(${currentScale})`,
      opacity: currentOpacity,
      animationDelay: `${startFrame / fps}s`
    };
  };
  
  // Energy ball visibility - ensure frame ranges don't overlap
  const ballPeakFrame = Math.min(collisionFrame + 10, explosionFrame - 1);
  const ballFadeFrame = Math.max(ballPeakFrame + 1, explosionFrame - 3);
  
  const ballOpacity = interpolate(frame, [collisionFrame, ballPeakFrame, ballFadeFrame, explosionFrame], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp'
  });
  
  const ballScalePeakFrame = Math.min(collisionFrame + 15, explosionFrame - 1);
  const ballScale = interpolate(frame, [collisionFrame, ballScalePeakFrame, explosionFrame], [0, 1.5, 0.2], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp'
  });
  
  // Dynamic particle systems
  const collisionParticles = Array.from({ length: effects.particleCount }, (_, i) => {
    const particleStart = collisionFrame - 5 + i * 0.5;
    const particleLife = interpolate(frame, [particleStart, particleStart + 40], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp'
    });
    
    const angle = (i / effects.particleCount) * Math.PI * 2;
    const distance = particleLife * 200;
    const x = Math.cos(angle) * distance;
    const y = Math.sin(angle) * distance * 0.7;
    
    const opacity = interpolate(particleLife, [0, 0.2, 0.8, 1], [0, 1, 1, 0], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp'
    });
    
    return { x, y, opacity, key: `collision-${i}` };
  });
  
  const explosionParticles = Array.from({ length: Math.floor(effects.particleCount * 1.3) }, (_, i) => {
    const particleStart = explosionFrame + i * 0.3;
    const particleLife = interpolate(frame, [particleStart, particleStart + 60], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp'
    });
    
    const angle = (i / (effects.particleCount * 1.3)) * Math.PI * 2;
    const distance = particleLife * 400;
    const x = Math.cos(angle + particleLife) * distance;
    const y = Math.sin(angle + particleLife) * distance * 0.8;
    
    const opacity = interpolate(particleLife, [0, 0.1, 0.7, 1], [0, 1, 1, 0], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp'
    });
    
    return { x, y, opacity, key: `explosion-${i}` };
  });
  
  // Enhanced glow burst effect
  const glowBurst = interpolate(frame, [collisionFrame, collisionFrame + 10, explosionFrame, explosionFrame + 15], [0, 1, 0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp'
  });
  
  return (
    // --- THIS IS THE FIX ---
    // Use the width and height from useVideoConfig()
    // instead of '100vw' and '100vh'
    <div style={{
      width: width,
      height: height,
      position: 'relative',
      overflow: 'hidden',
      transform: `translate(${shakeX}px, ${shakeY}px)`,
      background: `radial-gradient(ellipse at 50% 50%, 
        hsl(${bgRotation}deg 40% 15%) 0%, 
        #0F172A 70%)`
    }}>
    {/* --- End of fix --- */}
      
      {/* Enhanced vignette */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'radial-gradient(circle, transparent 40%, rgba(15, 23, 42, 0.8) 100%)',
        pointerEvents: 'none'
      }} />
      
      {/* Energy Ball */}
      {ballOpacity > 0 && (
        <div style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          width: `${effects.ballSize}px`,
          height: `${effects.ballSize}px`,
          transform: `translate(-50%, -50%) scale(${ballScale * ballPulse}) rotate(${ballRotation}deg)`,
          opacity: ballOpacity,
          zIndex: 10
        }}>
          {/* Core ball */}
          <div style={{
            width: '100%',
            height: '100%',
            borderRadius: '50%',
            background: `
              radial-gradient(circle at 30% 30%, 
                rgba(255, 255, 255, 0.9) 0%,
                ${hexToRgba(colors.primary, 0.8)} 30%,
                ${hexToRgba(colors.primary, 0.6)} 70%,
                transparent 100%)
            `,
            boxShadow: `
              0 0 30px ${hexToRgba(colors.primary, 0.8)},
              0 0 60px ${hexToRgba(colors.primary, 0.6)},
              0 0 90px ${hexToRgba(colors.primary, 0.4)},
              inset 0 0 30px rgba(255, 255, 255, 0.3)
            `,
            filter: 'blur(2px)'
          }} />
          
          {/* Energy rings around ball */}
          {[1, 2, 3].map(ring => (
            <div
              key={ring}
              style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                width: `${effects.ballSize + ring * 40}px`,
                height: `${effects.ballSize + ring * 40}px`,
                border: `${3 - ring}px solid ${hexToRgba(colors.primary, 0.6 / ring)}`,
                borderRadius: '50%',
                transform: `translate(-50%, -50%) rotate(${ballRotation * ring}deg)`,
                animation: `spin ${2 / ring}s linear infinite`
              }}
            />
          ))}
        </div>
      )}
      
      {/* Collision particles */}
      {collisionParticles.map(particle => (
        <div
          key={particle.key}
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: `linear-gradient(45deg, ${colors.primary}, rgba(255, 255, 255, 0.9))`,
            transform: `translate(${particle.x}px, ${particle.y}px)`,
            opacity: particle.opacity,
            boxShadow: `0 0 15px ${hexToRgba(colors.primary, 0.8)}`
          }}
        />
      ))}
      
      {/* Explosion particles */}
      {explosionParticles.map(particle => (
        <div
          key={particle.key}
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            width: '4px',
            height: '4px',
            borderRadius: '50%',
            background: `linear-gradient(45deg, ${colors.secondary}, rgba(255, 255, 255, 0.8))`,
            transform: `translate(${particle.x}px, ${particle.y}px)`,
            opacity: particle.opacity,
            boxShadow: `0 0 10px ${hexToRgba(colors.secondary, 0.8)}`
          }}
        />
      ))}
      
      {/* Enhanced glow burst background */}
      <div style={{
        position: 'absolute',
        left: '50%',
        top: '50%',
        width: '800px',
        height: '800px',
        transform: `translate(-50%, -50%) scale(${glowBurst * 3})`,
        background: `radial-gradient(circle, ${hexToRgba(colors.primary, 0.4)} 0%, transparent 70%)`,
        opacity: glowBurst,
        filter: 'blur(60px)'
      }} />
      
      {/* Collision flash */}
      {frame >= collisionFrame && frame <= collisionFrame + 5 && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `rgba(255, 255, 255, ${interpolate(frame, [collisionFrame, collisionFrame + 5], [0.3, 0])})`,
          pointerEvents: 'none',
          zIndex: 20
        }} />
      )}
      
      {/* Explosion flash */}
      {frame >= explosionFrame && frame <= explosionFrame + 8 && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `${hexToRgba(colors.primary, interpolate(frame, [explosionFrame, explosionFrame + 8], [0.4, 0]))}`,
          pointerEvents: 'none',
          zIndex: 20
        }} />
      )}
      
      {/* Main typography container */}
      <div style={{
        position: 'absolute',
        left: '50%',
        top: '50%',
        transform: `translate(-50%, -50%) scale(${globalScale})`,
        textAlign: 'center',
        fontFamily: "'Inter', -apple-system, sans-serif",
        fontWeight: 900,
        fontSize: words.length > 3 ? 'clamp(2rem, 6vw, 4rem)' : 'clamp(2.5rem, 8vw, 5rem)',
        lineHeight: words.length > 3 ? 1.2 : 1.1,
        letterSpacing: '-0.02em'
      }}>
        
        {/* Words */}
        {words.map((word, index) => (
          <div
            key={`${word}-${index}`}
            style={{
              display: 'block',
              marginBottom: words.length > 3 ? '0.2em' : '0.1em',
              ...getWordAnimation(index),
              backgroundImage: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 50%, rgba(255, 255, 255, 0.95) 100%)`, 
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              filter: `
                drop-shadow(0 4px 8px ${hexToRgba(colors.primary, 0.4)})
                drop-shadow(0 0 20px ${hexToRgba(colors.primary, 0.2)})
              `,
              textShadow: `
                0 1px 0 rgba(255, 255, 255, 0.1),
                0 2px 4px rgba(0, 0, 0, 0.3),
                inset 0 1px 0 rgba(255, 255, 255, 0.2)
              `,
              position: 'relative'
            }}
          >
            {word}
          </div>
        ))}
      </div>
      
      {/* CSS animations */}
      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(300%); }
        }
        
        @keyframes spin {
          from { transform: translate(-50%, -50%) rotate(0deg); }
          to { transform: translate(-50%, -50%) rotate(360deg); }
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-10px) rotate(180deg); }
        }
      `}</style>
    </div>
  );
};

export default KineticTypographyIntro;