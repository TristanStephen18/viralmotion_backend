import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

// ---- Config ----
const FPS = 30;
const DURATION_PER_IMAGE = 90; // 3s @30fps
const TRANSITION_DURATION = 20; // ~0.67s slide
const TOTAL_CYCLE_DURATION = DURATION_PER_IMAGE;

// Ken Burns motion per image (tweak as you like)
type KBConf = {
  zoomStart: number;
  zoomEnd: number;
  panX: number;
  panY: number;
};

const generateKBConfigs = (count: number): KBConf[] => {
  const configs: KBConf[] = [];

  for (let i = 0; i < count; i++) {
    // Alternate zoom in/out
    const zoomStart = i % 2 === 0 ? 1.0 : 1.15;
    const zoomEnd = i % 2 === 0 ? 1.15 : 1.0;

    // Pan direction alternates in a "circle"
    const panAngles = [0, 90, 180, 270]; // right, down, left, up
    const angle = panAngles[i % panAngles.length];
    const distance = 80; // tweak pan strength

    const panX = Math.round(Math.cos((angle * Math.PI) / 180) * distance);
    const panY = Math.round(Math.sin((angle * Math.PI) / 180) * distance);

    configs.push({ zoomStart, zoomEnd, panX, panY });
  }

  return configs;
};

const useTransitionProgress = (frame: number, fps: number) => {
  const local = frame % TOTAL_CYCLE_DURATION;
  const start = DURATION_PER_IMAGE - TRANSITION_DURATION;

  const raw = spring({
    frame: local - start,
    fps,
    config: { damping: 20, stiffness: 120, mass: 1 },
  });

  return interpolate(raw, [0, 1], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
};

// ---- Ken Burns Layer ----
const KenBurnsLayer: React.FC<{
  src: string;
  conf: KBConf;
  progress01: number;
  stageW: number;
  stageH: number;
}> = ({ src, conf, progress01, stageW, stageH }) => {
  const clamp = (v: number, min: number, max: number) =>
    Math.min(max, Math.max(min, v));

  const desiredStart = Math.min(conf.zoomStart, conf.zoomEnd);
  const desiredEnd = Math.max(conf.zoomStart, conf.zoomEnd);

  const EDGE_EPS = 0.02;

  const minScaleForPan = Math.max(
    1,
    1 + (2 * Math.abs(conf.panX)) / stageW,
    1 + (2 * Math.abs(conf.panY)) / stageH
  );

  const zoomStart = Math.max(desiredStart, minScaleForPan + EDGE_EPS);
  const zoomEnd = Math.max(desiredEnd, zoomStart + 0.0001);

  const scale = interpolate(progress01, [0, 1], [zoomStart, zoomEnd]);

  const PAN_FACTOR = 0.15;
  const PAN_CAP_PX = 16;
  const targetPanX =
    Math.sign(conf.panX) *
    Math.min(Math.abs(conf.panX) * PAN_FACTOR, PAN_CAP_PX);
  const targetPanY =
    Math.sign(conf.panY) *
    Math.min(Math.abs(conf.panY) * PAN_FACTOR, PAN_CAP_PX);

  const rawTx = interpolate(progress01, [0, 1], [0, targetPanX]);
  const rawTy = interpolate(progress01, [0, 1], [0, targetPanY]);

  const SAFE_MARGIN = 2;
  const maxSafePanX = Math.max(0, ((scale - 1) * stageW) / 2 - SAFE_MARGIN);
  const maxSafePanY = Math.max(0, ((scale - 1) * stageH) / 2 - SAFE_MARGIN);

  const tx = clamp(rawTx, -maxSafePanX, maxSafePanX);
  const ty = clamp(rawTy, -maxSafePanY, maxSafePanY);

  return (
    <AbsoluteFill style={{ overflow: "hidden", background: "#000" }}>
      <div
        style={{
          width: "100%",
          height: "100%",
          transform: `scale(${scale}) translate(${tx}px, ${ty}px)`,
          transformOrigin: "center center",
          willChange: "transform",
          position: "relative",
        }}
      >
        <img
          src={src}
          alt=""
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "center",
            filter: "contrast(1.07) saturate(1.08) brightness(1.02)",
          }}
        />

        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(80% 80% at 50% 50%, rgba(0,0,0,0) 50%, rgba(0,0,0,0.35) 100%)",
            pointerEvents: "none",
          }}
        />
      </div>
    </AbsoluteFill>
  );
};

// ---- Slide Frame ----
const SlideFrame: React.FC<{
  isCurrent: boolean;
  isNext: boolean;
  progress: number;
  children: React.ReactNode;
}> = ({ isCurrent, isNext, progress, children }) => {
  const leftInset = interpolate(progress, [0, 1], [100, 0]);
  const clipPath = isNext ? `inset(0% 0% 0% ${leftInset}%)` : "inset(0%)";

  const featherMask = isNext
    ? "linear-gradient(90deg, transparent 0px, black 12px)"
    : undefined;

  const zIndex = isNext ? 2 : isCurrent ? 1 : 0;

  return (
    <AbsoluteFill
      style={{
        opacity: 1,
        zIndex,
        clipPath,
        willChange: "clip-path",
        WebkitMaskImage: featherMask,
        maskImage: featherMask,
        WebkitMaskRepeat: "no-repeat",
        maskRepeat: "no-repeat",
        WebkitMaskSize: "100% 100%",
        maskSize: "100% 100%",
      }}
    >
      {children}
    </AbsoluteFill>
  );
};

// ---- Blurred Background ----
const BlurredBg: React.FC<{ src: string; opacity: number }> = ({
  src,
  opacity,
}) => (
  <AbsoluteFill
    style={{
      opacity,
      transform: "scale(1.1)",
      willChange: "opacity, transform",
    }}
  >
    <img
      src={src}
      alt=""
      style={{
        width: "100%",
        height: "100%",
        objectFit: "cover",
        filter: "blur(28px) saturate(1.2) brightness(0.95)",
      }}
    />
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: "linear-gradient(0deg, rgba(0,0,0,0.35), rgba(0,0,0,0.35))",
        pointerEvents: "none",
      }}
    />
  </AbsoluteFill>
);

// ---- Main Component ----
export type KenBurnsCarouselProps = {
  images: string[];
  cardWidthRatio?: number;
  cardHeightRatio?: number;
  blurBgOpacity?: number;
};

export const KenBurnsCarousel: React.FC<KenBurnsCarouselProps> = ({
  images,
  cardWidthRatio = 0.75,
  cardHeightRatio = 0.75,
  blurBgOpacity = 0.0,
}) => {
  const frame = useCurrentFrame();
  const { width, height, fps = FPS } = useVideoConfig();
  const KB = React.useMemo(
    () => generateKBConfigs(images.length),
    [images.length]
  );

  const current = Math.floor(frame / TOTAL_CYCLE_DURATION) % images.length;
  const next = (current + 1) % images.length;

  const slideProgress = useTransitionProgress(frame, fps);

  const local = frame % TOTAL_CYCLE_DURATION;
  const kbActive = interpolate(
    Math.min(local, DURATION_PER_IMAGE - TRANSITION_DURATION),
    [0, DURATION_PER_IMAGE - TRANSITION_DURATION],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
  const kbNext = slideProgress > 0 ? slideProgress * 0.001 : 0;

  const STAGE_W = Math.round(width * cardWidthRatio);
  const STAGE_H = Math.round(height * cardHeightRatio);
  const STAGE_LEFT = Math.round((width - STAGE_W) / 2);
  const STAGE_TOP = Math.round((height - STAGE_H) / 2);

  const bgCurrentOpacity = interpolate(
    slideProgress,
    [0, 1],
    [1, blurBgOpacity]
  );
  const bgNextOpacity = interpolate(slideProgress, [0, 1], [blurBgOpacity, 1]);

  const activeImg = images[current];
  const nextImg = images[next];

  return (
    <AbsoluteFill style={{ backgroundColor: "#000", overflow: "hidden" }}>
      <BlurredBg src={activeImg} opacity={bgCurrentOpacity} />
      <BlurredBg src={nextImg} opacity={bgNextOpacity} />

      <div
        style={{
          position: "absolute",
          left: STAGE_LEFT,
          top: STAGE_TOP,
          width: STAGE_W,
          height: STAGE_H,
          borderRadius: 24,
          overflow: "hidden",
          boxShadow: "0 10px 30px rgba(0,0,0,0.45), 0 2px 8px rgba(0,0,0,0.25)",
          outline: "1px solid rgba(255,255,255,0.08)",
          background: "#000",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: 24,
            boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.06)",
            pointerEvents: "none",
            zIndex: 5,
          }}
        />

        <SlideFrame isCurrent isNext={false} progress={slideProgress}>
          <KenBurnsLayer
            src={activeImg}
            conf={KB[current % KB.length]}
            progress01={kbActive}
            stageW={STAGE_W}
            stageH={STAGE_H}
          />
        </SlideFrame>

        <SlideFrame isCurrent={false} isNext progress={slideProgress}>
          <KenBurnsLayer
            src={nextImg}
            conf={KB[next % KB.length]}
            progress01={kbNext}
            stageW={STAGE_W}
            stageH={STAGE_H}
          />
        </SlideFrame>
      </div>
    </AbsoluteFill>
  );
};
