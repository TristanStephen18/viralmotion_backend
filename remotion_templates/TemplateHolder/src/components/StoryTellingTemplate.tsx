import {
  AbsoluteFill,
  Audio,
  Video,
  useVideoConfig,
  useCurrentFrame,
  Sequence,
} from "remotion";

type Word = { word: string; start: number; end: number };

interface Words {
  word: string;
  start: number;
  end: number;
}

type ScriptStructure = {
  story: string;
  duration: number;
  words: Words[];
};

type StoryTellingVideoProps = {
  script: ScriptStructure;
  voiceoverPath: string;
  duration: number;
  fontSize: number;
  fontFamily: string;
  fontColor: string;
  sentenceBgColor: string;
  backgroundOverlayColor: string;
  backgroundMusicPath?: string;
  backgroundVideo: string;
  musicVolume?: number;
};

export const StoryTellingVideo: React.FC<StoryTellingVideoProps> = ({
  script,
  voiceoverPath,
  fontSize,
  fontFamily,
  fontColor,
  sentenceBgColor,
  backgroundOverlayColor,
  backgroundMusicPath,
  musicVolume = 0.15,
  backgroundVideo,
}) => {
  const { fps } = useVideoConfig();
  const { words } = script;
  const bg = backgroundVideo;

  return (
    <AbsoluteFill>
      <Video
        src={bg}
        muted
        loop
        style={{
          position: "absolute",
          width: "100%",
          height: "100%",
          objectFit: "cover",
        }}
      />
      <AbsoluteFill style={{ backgroundColor: backgroundOverlayColor }} />

      {/* Karaoke Section */}
      <Sequence from={0}>
        <SentenceBuilder
          words={words}
          fps={fps}
          fontSize={fontSize}
          fontFamily={fontFamily}
          fontColor={fontColor}
          sentenceBgColor={sentenceBgColor}
        />
        <Audio src={voiceoverPath} />
      </Sequence>

      {/* Optional background music 🎶 */}
      {backgroundMusicPath && (
        <Audio src={backgroundMusicPath} volume={musicVolume} />
      )}
    </AbsoluteFill>
  );
};

type SentenceBuilderProps = {
  words: Word[];
  fps: number;
  fontSize: number;
  fontFamily: string;
  fontColor: string;
  sentenceBgColor: string;
};

const SentenceBuilder: React.FC<SentenceBuilderProps> = ({
  words,
  fps,
  fontSize,
  fontFamily,
  fontColor,
  sentenceBgColor,
}) => {
  const frame = useCurrentFrame();

  // Break into lines
  const wordsPerLine = 8;
  const lines: Word[][] = [];
  for (let i = 0; i < words.length; i += wordsPerLine) {
    lines.push(words.slice(i, i + wordsPerLine));
  }

  // Group lines into blocks of 2
  const lineBlocks: Word[][][] = [];
  for (let i = 0; i < lines.length; i += 2) {
    lineBlocks.push(lines.slice(i, i + 2));
  }

  // Determine active block by frame
  const activeBlockIndex = lineBlocks.findIndex((block) => {
    const startFrame = Math.floor(block[0][0].start * fps);
    const lastLine = block[block.length - 1];
    const endFrame = Math.floor(lastLine[lastLine.length - 1].end * fps);
    return frame >= startFrame && frame <= endFrame;
  });

  if (activeBlockIndex === -1) return null;
  const activeBlock = lineBlocks[activeBlockIndex];

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        padding: 60,
        textAlign: "center",
        color: fontColor,
        fontSize: fontSize,
        fontFamily: fontFamily,
        fontWeight: 600,
        lineHeight: 1.5,
        textShadow:
          "2px 2px 6px rgba(0,0,0,0.7), -2px -2px 6px rgba(0,0,0,0.5)",
      }}
    >
      {activeBlock.map((line, li) => (
        <p
          key={li}
          style={{
            margin: "8px 0",
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: "10px",
          }}
        >
          {line.map((w, i) => {
            const wordStartFrame = Math.floor(w.start * fps);
            if (frame < wordStartFrame) return null;

            const isLatest =
              i ===
              line.findIndex(
                (ww) =>
                  frame >= Math.floor(ww.start * fps) &&
                  frame < Math.floor(ww.end * fps)
              );

            const bg = isLatest ? sentenceBgColor : "transparent";

            return (
              <span
                key={i}
                style={{
                  backgroundColor: bg,
                  padding: isLatest ? "2px 6px" : undefined,
                  borderRadius: isLatest ? "4px" : undefined,
                  display: "inline-block",
                }}
              >
                {w.word}
              </span>
            );
          })}
        </p>
      ))}
    </AbsoluteFill>
  );
};
