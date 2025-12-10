import { Composition } from "remotion";
import { FactsCardVideo } from "./components/FactsCardTemplate";
import { BarGraph } from "./components/BarGraphTemplate";
import { getAudioData } from "@remotion/media-utils";
import { SplitScreen } from "./components/SplitScreen";
import { QuoteComposition } from "./components/QuoteTemplate";
import KpiFlipCards from "./components/KpiFlipCardsTemplate";
import { KenBurnsCarousel } from "./components/KenBurnsSwipe";
import {
  ChatVideo2,
  ChatVideoProps,
  TranscriptJson,
} from "./components/FakeTextConversation";
import { MyRedditVideo } from "./components/RedditVideoTemplate";
import { StoryTellingVideo } from "./components/StoryTellingTemplate";
import {
  SimpleGraphProps,
  SimpleTrendGraph,
} from "./components/CurveLineTrend/SimplifierComponent";
import { NewTypingAnimation } from "./components/NewTextTyping/TypingAnimation";
import { calculateDuration, durationIndicatorQuote } from "./helpers";
import KineticTypographyIntro from "./components/KineticText";
import {
  FlipCardsCompositionComponent,
  MetricCardsProps,
} from "./components/FlipCards";
import { LogoCompositionComponent } from "./components/LogoAnimation";
import * as defaultValues from "./defaultvalues";
import { TestTextComposition } from "./components/SampleTemplate";
import { DynamicTemplate, Layer } from "./components/DynamicLayerComposition";

type Derived = React.ComponentProps<typeof ChatVideo2>;

const exampleLayers: Layer[] = [
  {
    id: "bg-1",
    name: "Background",
    type: "image",
    visible: true,
    locked: false,
    startFrame: 0,
    endFrame: 300,
    position: { x: 50, y: 50 },
    size: { width: 100, height: 100 },
    rotation: 0,
    opacity: 1,
    src: "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=1920",
    isBackground: true,
    objectFit: "cover",
  },
  {
    id: "text-1",
    name: "Title",
    type: "text",
    visible: true,
    locked: false,
    startFrame: 30,
    endFrame: 300,
    position: { x: 50, y: 30 },
    size: { width: 80, height: 20 },
    rotation: 0,
    opacity: 1,
    content: "Hello World",
    fontFamily: "Arial, sans-serif",
    fontSize: 10,
    fontColor: "#ffffff",
    fontWeight: "bold",
    fontStyle: "normal",
    textAlign: "center",
    lineHeight: 1.2,
    animation: {
      entrance: "slideUp",
      entranceDuration: 30,
    },
  },
];

type RootProps = Derived & {
  chatdata?: TranscriptJson;
  bgVideo?: string;
  chatAudio?: string;
  musicAudio?: string;
  musicBase?: number;
  musicWhileTalking?: number;
  duckAttackMs?: number;
  duckReleaseMs?: number;
};

const WIDTH = 1080;
const HEIGHT = 1920;
const FPS = 30;
const TAIL_PADDING_SEC = 1.0;

export const RemotionRoot: React.FC = () => {
  const delayStart = 0.5;
  const delayStep = 1;
  const numCards = 4; // Default number of cards
  const flipAnimationTime = 2; // Time for flip animation to complete
  const freezeTime = 1; // Freeze at the end

  // Total duration = start delay + (cards * step delay) + flip animation + freeze
  const calculatedDuration = Math.ceil(
    (delayStart + (numCards - 1) * delayStep + flipAnimationTime + freezeTime) *
      30,
  );
  return (
    <>
      <Composition
        id="GlassFactsVideo"
        component={FactsCardVideo}
        durationInFrames={30 * defaultValues.facstCardDefaultValues.duration}
        fps={30}
        height={1920}
        width={1080}
        defaultProps={defaultValues.facstCardDefaultValues}
        calculateMetadata={async ({ props }) => {
          return {
            durationInFrames: 30 * props.duration,
            fps: 30,
            width: 1080,
            height: 1920,
          };
        }}
      />
      <Composition
        id="BarGraph"
        component={BarGraph}
        durationInFrames={defaultValues.barGraphDefaultValues.duration * 30}
        fps={30}
        height={1920}
        width={1080}
        defaultProps={defaultValues.barGraphDefaultValues}
      />
      <Composition
        id="SplitScreen"
        component={SplitScreen}
        defaultProps={defaultValues.splitScreenDefaultValues}
        fps={60}
        width={1080}
        height={1920}
        calculateMetadata={async ({ props }) => {
          const fps = 60;
          const durationInFrames = Math.ceil(props.duration * fps);

          return {
            durationInFrames,
            fps,
            width: 1080,
            height: 1920,
          };
        }}
      />
      <Composition
        id="QuoteComposition"
        component={QuoteComposition}
        durationInFrames={1}
        fps={30}
        height={1920}
        width={1080}
        defaultProps={defaultValues.quoetTemplateDefaultValues}
        calculateMetadata={async ({ props }) => {
          const durationSeconds = durationIndicatorQuote(props.quote.length);
          return {
            props,
            durationInFrames: durationSeconds * 30,
          };
        }}
      />

      <Composition
        id="KpiFlipCard"
        component={KpiFlipCards}
        durationInFrames={calculatedDuration}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={defaultValues.kpiFlipCardsDefaultValues}
        calculateMetadata={({ props }) => {
          const actualCards = props.cardsData?.length || numCards;
          const actualDelayStart = props.delayStart ?? delayStart;
          const actualDelayStep = props.delayStep ?? delayStep;

          const duration = Math.ceil(
            (actualDelayStart +
              (actualCards - 1) * actualDelayStep +
              flipAnimationTime +
              freezeTime +
              3) *
              30,
          );

          return {
            durationInFrames: duration,
          };
        }}
      />
      <Composition
        id="KenBurnsCarousel"
        component={KenBurnsCarousel}
        durationInFrames={defaultValues.kenburnsDefaultValues.duration * 30}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={defaultValues.kenburnsDefaultValues}
      />
      <Composition
        id="Sample"
        component={TestTextComposition}
        durationInFrames={3 * 30}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="ChatVideo"
        component={ChatVideo2}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
        defaultProps={defaultValues.fakeTextDefaultValues as ChatVideoProps}
        calculateMetadata={async ({ props }) => {
          const p = {
            ...defaultValues.fakeTextDefaultValues,
            ...(props ?? {}),
          } as Required<RootProps>;

          let lastTime = 0;
          // 1. Check chat JSON timestamps
          try {
            const json = p.chatdata;

            if (Array.isArray((json as any)?.segments)) {
              const segments = (json as any).segments as Array<{
                start_time?: number;
                end_time?: number;
              }>;
              lastTime = segments.reduce((max, s) => {
                const start = Number(s.start_time) || 0;
                const end = Number(s.end_time) || 0;
                return Math.max(max, start, end);
              }, 0);
            } else if (Array.isArray(json)) {
              const arr = json as Array<{
                timestamp?: number;
                duration?: number;
              }>;
              lastTime = arr.reduce((max, m) => {
                const start = Number(m.timestamp) || 0;
                const dur = Number(m.duration);
                const end = start + (Number.isFinite(dur) ? dur : 1.2);
                return Math.max(max, start, end);
              }, 0);
            }
          } catch {
            lastTime = 0;
          }

          // 2. Check audio duration
          let audioDuration = 0;
          try {
            const audioData = await getAudioData(p.chatAudio);
            audioDuration = audioData.durationInSeconds;
          } catch {
            audioDuration = 0;
          }

          // 3. Pick the longer one
          const finalDuration =
            Math.max(lastTime, audioDuration) + TAIL_PADDING_SEC;
          const durationInFrames = Math.max(1, Math.ceil(finalDuration * FPS));

          return {
            durationInFrames: durationInFrames + 1,
            fps: FPS,
            width: WIDTH,
            height: HEIGHT,
          };
        }}
      />
      <Composition
        id="RedditNarration"
        component={MyRedditVideo}
        durationInFrames={Math.ceil(
          defaultValues.redditDefaultValues.duration * 30,
        )}
        fps={30}
        height={1920}
        width={1080}
        defaultProps={{
          script: defaultValues.redditDefaultValues.script,
          voiceoverPath: defaultValues.redditDefaultValues.voiceoverPath,
          duration: defaultValues.redditDefaultValues.duration,
          fontSize: defaultValues.redditDefaultValues.fontSize,
          fontFamily: defaultValues.redditDefaultValues.fontFamily,
          fontColor: defaultValues.redditDefaultValues.fontColor,
          sentenceBgColor: defaultValues.redditDefaultValues.sentenceBgColor,
          backgroundOverlayColor: "rgba(0,0,0,0.6)",
          backgroundVideo: defaultValues.redditDefaultValues.backgroundVideo,
          backgroundMusicPath:
            defaultValues.redditDefaultValues.backgroundMusicPath,
          musicVolume: 0.2,
        }}
        calculateMetadata={async ({ props }) => {
          const fps = 30;
          const durationInFrames = Math.ceil(props.duration * fps);

          return {
            durationInFrames,
            fps,
            width: 1080,
            height: 1920,
          };
        }}
      />
      <Composition
        id="StoryTellingVideo"
        component={StoryTellingVideo}
        durationInFrames={Math.ceil(
          defaultValues.storyTellingDefaultValues.duration * 30,
        )}
        fps={30}
        height={1920}
        width={1080}
        defaultProps={{
          script: defaultValues.storyTellingDefaultValues.script,
          voiceoverPath: defaultValues.storyTellingDefaultValues.voiceoverPath,
          duration: defaultValues.storyTellingDefaultValues.duration,
          fontSize: defaultValues.storyTellingDefaultValues.fontSize,
          fontFamily: defaultValues.storyTellingDefaultValues.fontFamily,
          fontColor: defaultValues.storyTellingDefaultValues.fontColor,
          sentenceBgColor:
            defaultValues.storyTellingDefaultValues.sentenceBgColor,
          backgroundOverlayColor: "rgba(0,0,0,0.6)",
          backgroundVideo:
            defaultValues.storyTellingDefaultValues.backgroundVideo,
          backgroundMusicPath:
            defaultValues.storyTellingDefaultValues.backgroundMusicPath,
          musicVolume: 0.2,
        }}
        calculateMetadata={async ({ props }) => {
          const fps = 30;
          const durationInFrames = Math.ceil(props.duration * fps);

          return {
            durationInFrames,
            fps,
            width: 1080,
            height: 1920,
          };
        }}
      />
      <Composition
        id="CurveLineTrend"
        component={SimpleTrendGraph}
        durationInFrames={
          30 * defaultValues.curveLineTrendDefaultValues.duration
        }
        fps={30}
        width={1080}
        height={1920}
        defaultProps={
          defaultValues.curveLineTrendDefaultValues as SimpleGraphProps
        }
      />
      <Composition
        id="NewTexTyping"
        component={NewTypingAnimation}
        durationInFrames={calculateDuration(
          defaultValues.textTypingDefaultValues.phrase,
        )}
        fps={60}
        width={1080}
        height={1920}
        defaultProps={{
          phraseData: defaultValues.textTypingDefaultValues.phrase,
          fontIndex: defaultValues.textTypingDefaultValues.fontIndex, // Poppins
          backgroundIndex:
            defaultValues.textTypingDefaultValues.backgroundIndex, // Ambient Flow
          audioIndex: defaultValues.textTypingDefaultValues.audioIndex, // Soft Keys
        }}
      />
      <Composition
        id="KineticText"
        component={KineticTypographyIntro}
        fps={30}
        defaultProps={{
          config: defaultValues.defaultConfig,
        }}
        width={1080}
        height={1920}
        durationInFrames={240}
      />
      <Composition
        id="FlipCards"
        durationInFrames={180}
        component={FlipCardsCompositionComponent}
        defaultProps={{
          config: defaultValues.flipcardsdefaulvalues as MetricCardsProps,
        }}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="LogoAnimation"
        component={LogoCompositionComponent}
        defaultProps={{ config: defaultValues.logoanimationdefaultvalues }}
        calculateMetadata={({ props }) => {
          const fps = 30;
          const outlineFrames = props.config.durationOutline * fps;
          const fillFrames = props.config.durationFill * fps;
          const endPauseFrames = props.config.durationEndPause * fps;

          return {
            durationInFrames: outlineFrames + fillFrames + endPauseFrames,
            fps: 30,
            width: 1920,
            height: 1080,
          };
        }}
      />
      <Composition
        id="DynamicVideo"
        component={DynamicTemplate}
        durationInFrames={300}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{
          config: {
            layers: exampleLayers,
            backgroundColor: "#000000",
            duration: 10,
          },
        }}
        calculateMetadata={({ props }) => {
          const duration = props.config?.duration ?? 10; // fallback to 10 seconds
          const fps = 30;

          return {
            durationInFrames: duration * fps,
          };
        }}
      />
    </>
  );
};
