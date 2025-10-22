// TypingVideo.tsx
import { AbsoluteFill, Audio, staticFile } from "remotion";
import { TypingText } from "./TypingText";

type TypingVideoProps = {
  content: string;
  bgimage: string;
  duration: number; // multiplied by fps
  fps: number;
  fontSize: number;
  fontColor: string;
  fontFamily: string;
  sound: string;
};

export const TypingVideo: React.FC<TypingVideoProps> = ({
  content,
  bgimage,
  duration,
  fps,
  fontSize,
  fontColor,
  fontFamily,
  sound,
}) => {
  const durationInFrames = duration * fps;

  return (
    <AbsoluteFill
      style={{
        backgroundImage: `url(${bgimage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "40px",
      }}
    >
      {/* Background typing sound (looped) */}
      {sound && <Audio src={staticFile(sound)} loop />}

      <TypingText
        content={content}
        durationInFrames={durationInFrames}
        fontSize={fontSize}
        fontColor={fontColor}
        fontFamily={fontFamily}
      />
    </AbsoluteFill>
  );
};
