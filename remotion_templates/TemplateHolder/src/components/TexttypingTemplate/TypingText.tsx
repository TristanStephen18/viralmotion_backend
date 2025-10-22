// TypingText.tsx
import { useCurrentFrame, interpolate } from "remotion";

type TypingTextProps = {
  content: string;
  durationInFrames: number;
  fontSize: number;
  fontColor: string;
  fontFamily: string;
};

export const TypingText: React.FC<TypingTextProps> = ({
  content,
  durationInFrames,
  fontSize,
  fontColor,
  fontFamily,
}) => {
  const frame = useCurrentFrame();

  // Typing should finish earlier: e.g. 70% of duration
  const typingFrames = durationInFrames * 0.85;

  // Progress goes 0 → 1 over typingFrames
  const progress = interpolate(frame, [0, typingFrames], [0, 1], {
    extrapolateRight: "clamp",
  });

  // Characters revealed based on progress
  const charactersToShow = Math.floor(progress * content.length);

  return (
    <div
      style={{
        fontSize,
        color: fontColor,
        textShadow: "2px 2px 4px rgba(0,0,0,0.7)",
        whiteSpace: "pre-wrap",
        fontFamily,
        textAlign: "center",
        display: "inline-block",
      }}
    >
      {content.slice(0, charactersToShow)}
      <span
        style={{
          fontFamily,
          fontSize,
          color: fontColor,
          opacity: frame % 30 < 15 ? 1 : 0,
        }}
      >
        |
      </span>
    </div>
  );
};
