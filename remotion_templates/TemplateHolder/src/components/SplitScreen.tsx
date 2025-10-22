// src/SplitScreenComposition.tsx
import React from "react";
import {
  AbsoluteFill,
  Video,
  useCurrentFrame,
  interpolate,
  Easing,
} from "remotion";

export type SplitScreenProps = {
  topVideoUrl: string;
  bottomVideoUrl: string;
  topHeightPercent?: number;
  bottomHeightPercent?: number;
  topOpacity?: number;
  bottomOpacity?: number;
  topVolume?: number;
  bottomVolume?: number;
  swap?: boolean;
  transitionDuration?: number;    // in frames
  slideOffsetPercent?: number;    // how far they travel (default 30%)
};

export const SplitScreen: React.FC<SplitScreenProps> = ({
  topVideoUrl,
  bottomVideoUrl,
  topHeightPercent = 50,
  bottomHeightPercent = 50,
  topOpacity = 1,
  bottomOpacity = 1,
  topVolume = 1,
  bottomVolume = 0,
  swap = false,
  transitionDuration = 30,
  slideOffsetPercent = 30, // not full screen, just a small offset
}) => {
  const frame = useCurrentFrame();

  const progress = interpolate(frame, [0, transitionDuration], [0, 1], {
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  const topStyle: React.CSSProperties = {
    width: "100%",
    height: `${topHeightPercent}%`,
    overflow: "hidden",
    opacity: topOpacity,
    transform: `translateY(${(1 - progress) * -slideOffsetPercent}%)`,
  };

  const bottomStyle: React.CSSProperties = {
    width: "100%",
    height: `${bottomHeightPercent}%`,
    overflow: "hidden",
    opacity: bottomOpacity,
    transform: `translateY(${(1 - progress) * slideOffsetPercent}%)`,
  };

  const top = (
    <div style={topStyle}>
      <Video
        src={topVideoUrl}
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
        volume={topVolume}
      />
    </div>
  );

  const bottom = (
    <div style={bottomStyle}>
      <Video
        src={bottomVideoUrl}
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
        volume={bottomVolume}
        loop
      />
    </div>
  );

  return (
    <AbsoluteFill className="bg-black flex flex-col">
      {swap ? bottom : top}
      {swap ? top : bottom}
    </AbsoluteFill>
  );
};
