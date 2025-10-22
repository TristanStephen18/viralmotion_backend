// TypingAnimation.tsx - Enhanced with dynamic phrase support
import React from 'react';
import {
  AbsoluteFill,
  Audio,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
  Easing,
} from 'remotion';
import { AnimatedBackground } from './AnimatedBackgrounds';
import { FONTS, BACKGROUNDS, AUDIO_FILES, DEFAULT_SETTINGS } from '../../texttypingassets';

export interface PhraseProps  {
  lines: string[];
  category: string;
  mood: string;
}

interface TypingAnimationProps {
  phraseData?: PhraseProps;
  fontIndex?: number;
  backgroundIndex?: number;
  audioIndex?: number;
  typingSpeed?: number;
  cursorBlinkSpeed?: number;
  fontSize?: number;
  customTextColor?: string;
  customBackgroundColor?: string;
  // New props for dynamic phrases
  customPhrase?: string;
  customPhraseLines?: string[];
}

// Helper function to capitalize first letter of a phrase
function capitalizeFirstLetter(text: string): string {
  if (!text) return text;
  
  // Find the first alphabetic character and capitalize it
  const trimmedText = text.trim();
  if (trimmedText.length === 0) return trimmedText;
  
  // Handle cases where the first character might not be a letter
  let firstLetterIndex = 0;
  while (firstLetterIndex < trimmedText.length && !/[a-zA-Z]/.test(trimmedText[firstLetterIndex])) {
    firstLetterIndex++;
  }
  
  if (firstLetterIndex >= trimmedText.length) {
    // No letters found, return as is
    return trimmedText;
  }
  
  return trimmedText.substring(0, firstLetterIndex) + 
         trimmedText[firstLetterIndex].toUpperCase() + 
         trimmedText.substring(firstLetterIndex + 1);
}

// Helper function to split long text into lines
function splitIntoLines(text: string, maxLength: number = 50): string[] {
  if (text.length <= maxLength) {
    return [text];
  }
  
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';
  
  for (const word of words) {
    if ((currentLine + ' ' + word).length <= maxLength) {
      currentLine = currentLine ? currentLine + ' ' + word : word;
    } else {
      if (currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        // Word is longer than maxLength, force break
        lines.push(word);
      }
    }
  }
  
  if (currentLine) {
    lines.push(currentLine);
  }
  
  return lines;
}

export const NewTypingAnimation: React.FC<TypingAnimationProps> = ({
  phraseData = {
     lines: ['Stay hungry,', 'stay foolish'],
    category: 'wisdom',
    mood: 'iconic'
  },
  fontIndex = 0,
  backgroundIndex = 0,
  audioIndex = 0,
  typingSpeed = DEFAULT_SETTINGS.typingSpeed,
  cursorBlinkSpeed = DEFAULT_SETTINGS.cursorBlinkSpeed,
  fontSize = DEFAULT_SETTINGS.fontSize,
  customTextColor,
  customBackgroundColor,
  customPhrase,
  customPhraseLines,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  
  // Get configurations
  const phrase = phraseData;
  const font = FONTS[fontIndex] || FONTS[0];
  const background = BACKGROUNDS[backgroundIndex] || BACKGROUNDS[0];
  const audio = AUDIO_FILES[audioIndex] || AUDIO_FILES[0];
  
  // Determine lines to use - priority: customPhraseLines > customPhrase > phrase.lines
  let lines: string[];
  if (customPhraseLines && customPhraseLines.length > 0) {
    // Capitalize first letter of each line in custom phrase lines
    lines = customPhraseLines.map(line => capitalizeFirstLetter(line));
  } else if (customPhrase) {
    // Capitalize the custom phrase and split into lines
    const capitalizedPhrase = capitalizeFirstLetter(customPhrase);
    lines = splitIntoLines(capitalizedPhrase, 50);
  } else {
    // Use default phrase lines (assume they're already properly formatted)
    lines = phrase.lines;
  }
  
  const textColor = customTextColor || background.textColor;
  const backgroundColor = customBackgroundColor || background.backgroundColor;
  
  // Calculate total characters to type
  const totalChars = lines.reduce((sum, line) => sum + line.length, 0);
  
  // Calculate typing duration in frames
  const typingDurationFrames = Math.ceil((totalChars / typingSpeed) * fps);
  
  // Calculate how many characters should be visible at current frame
  const charsPerFrame = typingSpeed / fps;
  const visibleChars = frame <= typingDurationFrames 
    ? Math.floor(frame * charsPerFrame)
    : totalChars;
  
  // Enhanced cursor animation with smooth pulsing
  const cursorOpacity = frame <= typingDurationFrames 
    ? interpolate(
        Math.sin(frame * (cursorBlinkSpeed * Math.PI) / fps),
        [-1, 1],
        [0.2, 1]
      )
    : 0;
  
  // Add subtle entrance animation
  const textEntrance = interpolate(
    frame,
    [0, 20],
    [0, 1],
    {
      extrapolateRight: 'clamp',
      easing: Easing.out(Easing.cubic),
    }
  );
  
  // Auto-adjust font size based on content length
  const adjustedFontSize = React.useMemo(() => {
    const maxLineLength = Math.max(...lines.map(line => line.length));
    const lineCount = lines.length;
    
    // Base font size adjustments
    let adjustedSize = fontSize;
    
    // Reduce font size for very long lines
    if (maxLineLength > 60) {
      adjustedSize = Math.max(fontSize * 0.7, 40);
    } else if (maxLineLength > 40) {
      adjustedSize = Math.max(fontSize * 0.85, 50);
    }
    
    // Reduce font size for many lines
    if (lineCount > 4) {
      adjustedSize = Math.max(adjustedSize * 0.8, 35);
    } else if (lineCount > 3) {
      adjustedSize = Math.max(adjustedSize * 0.9, 45);
    }
    
    return adjustedSize;
  }, [lines, fontSize]);
  
  // Render lines with typing effect
  const renderLines = () => {
    let charCount = 0;
    
    return lines.map((line, lineIndex) => {
      const lineStart = charCount;
      const lineEnd = charCount + line.length;
      charCount = lineEnd;
      
      let visibleInLine = 0;
      let showCursor = false;
      
      if (visibleChars > lineStart) {
        visibleInLine = Math.min(visibleChars - lineStart, line.length);
        showCursor = frame <= typingDurationFrames && visibleChars >= lineStart && visibleChars <= lineEnd;
      }
      
      const displayText = line.substring(0, visibleInLine);
      
      // Line entrance animation
      const lineDelay = lineIndex * 5;
      const lineOpacity = interpolate(
        frame,
        [lineDelay, lineDelay + 10],
        [0, 1],
        {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        }
      );
      
      return (
        <div
          key={lineIndex}
          style={{
            position: 'absolute',
            top: `${lineIndex * (adjustedFontSize * 1.4)}px`,
            left: 0,
            width: '100%',
            height: `${adjustedFontSize * 1.4}px`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: lineOpacity,
          }}
        >
          <span
            style={{
              fontSize: `${adjustedFontSize}px`,
              fontFamily: font.family,
              fontWeight: font.weight,
              color: textColor,
              letterSpacing: '-0.02em',
              textAlign: 'center',
              position: 'relative',
              textShadow: background.type === 'animated' 
                ? `0 0 20px rgba(0,0,0,0.3), 0 2px 4px rgba(0,0,0,0.2)` 
                : 'none',
              transform: `scale(${textEntrance})`,
              wordBreak: 'break-word',
              maxWidth: '95%',
            }}
          >
            {displayText}
            {showCursor && (
              <span
                style={{
                  display: 'inline-block',
                  width: '4px',
                  height: `${adjustedFontSize}px`,
                  backgroundColor: textColor,
                  opacity: cursorOpacity,
                  marginLeft: '2px',
                  verticalAlign: 'text-bottom',
                  boxShadow: `0 0 10px ${textColor}`,
                  borderRadius: '2px',
                }}
              />
            )}
          </span>
        </div>
      );
    });
  };
  
  return (
    <AbsoluteFill>
      {/* Animated or static background */}
      <AnimatedBackground
        type={background.type}
        backgroundColor={backgroundColor}
        animation={background.animation}
      />
      
      {/* Subtle vignette overlay for better text readability */}
      {background.type === 'animated' && (
        <AbsoluteFill
          style={{
            background: 'radial-gradient(circle, transparent 40%, rgba(0,0,0,0.2) 100%)',
            zIndex: 1,
          }}
        />
      )}
      
      {/* Text content */}
      <AbsoluteFill
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2,
        }}
      >
        <div
          style={{
            position: 'relative',
            width: '90%',
            height: `${lines.length * adjustedFontSize * 1.4}px`,
          }}
        >
          {renderLines()}
        </div>
      </AbsoluteFill>
      
      {/* Audio with smooth fade */}
      {frame <= typingDurationFrames && (
        <Audio
          src={audio.filename}
          startFrom={0}
          endAt={typingDurationFrames}
          volume={(f) => {
            // Smoother fade in/out
            if (f < 10) return interpolate(f, [0, 10], [0, 0.8], { 
              extrapolateRight: 'clamp',
              easing: Easing.out(Easing.quad) 
            });
            if (f > typingDurationFrames - 10) {
              return interpolate(
                f, 
                [typingDurationFrames - 10, typingDurationFrames], 
                [0.8, 0], 
                { 
                  extrapolateLeft: 'clamp',
                  easing: Easing.in(Easing.quad) 
                }
              );
            }
            return 0.8;
          }}
        />
      )}
    </AbsoluteFill>
  );
};

// Export for backward compatibility
// export { PHRASES } from '../config';