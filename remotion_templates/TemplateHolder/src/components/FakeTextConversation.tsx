import React, { useEffect, useMemo, useState } from "react";
import {
  AbsoluteFill,
  Audio,
  Video,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  Easing,
} from "remotion";

 const defaultchats = {
  "language_code": "eng",
  "segments": [
    {
      "text": "Hey, have you tried The Green Fork yet?",
      "start_time": 0,
      "end_time": 2.220375,
      "speaker": {
        "id": "person_1",
        "name": "person 1"
      }
    },
    {
      "text": "Not yet. Is it any good?",
      "start_time": 2.220375,
      "end_time": 4.075063,
      "speaker": {
        "id": "person_2",
        "name": "person 2"
      }
    }
  ],
}

// ---------- Types ----------
interface TranscriptSpeaker {
  id?: string;
  name?: string;
}
interface TranscriptSegment {
  text?: string;
  start_time?: number;
  end_time?: number;
  speaker?: TranscriptSpeaker;
}
export interface TranscriptJson {
  language_code?: string;
  segments?: TranscriptSegment[];
}

export type ChatVideoProps = {
  chatdata?: TranscriptJson;
  bgVideo?: string;
  chatAudio?: string;
  musicAudio?: string;
  musicBase?: number;
  musicWhileTalking?: number;
  duckAttackMs?: number;
  duckReleaseMs?: number;
  timeShiftSec?: number;

  // New props
  fontFamily?: string;
  fontSize?: number;
  fontColor?: string;
  chatTheme?: "default" | "discord" | "messenger" | "whatsapp";
  avatars?: {
    left?: string;
    right?: string;
  };
};

interface ChatMessage {
  id: number;
  sender: string;
  message: string;
  timestamp: number;
  duration: number;
}
interface Persona {
  name: string;
  avatar?: string;
  color: string;
  position: "left" | "right";
}

const COLORS = [
  "#0EA5E9",
  "#7C3AED",
  "#22C55E",
  "#DB2777",
  "#F59E0B",
  "#EF4444",
  "#10B981",
  "#3B82F6",
];

type Theme = {
  leftBubble: string;
  rightBubble: string;
  leftText: string;
  rightText: string;
};

const THEMES: Record<"default" | "discord" | "messenger" | "whatsapp", Theme> =
  {
    default: {
      leftBubble: "#E5E5EA",
      rightBubble: "#0EA5E9",
      leftText: "#000",
      rightText: "#fff",
    },
    discord: {
      leftBubble: "#2f3136",
      rightBubble: "#5865f2",
      leftText: "#dcddde",
      rightText: "#fff",
    },
    messenger: {
      leftBubble: "#f0f0f0",
      rightBubble: "#0084ff",
      leftText: "#000",
      rightText: "#fff",
    },
    whatsapp: {
      leftBubble: "#e1ffc7",
      rightBubble: "#dcf8c6",
      leftText: "#000",
      rightText: "#000",
    },
  };

const clamp = (v: number, lo: number, hi: number) =>
  Math.max(lo, Math.min(hi, v));

function transcriptToChat(json: TranscriptJson): ChatMessage[] {
  const segments = Array.isArray(json?.segments) ? json.segments : [];
  return segments
    .map((seg, i) => {
      const raw = String(seg?.text ?? "").trim();
      if (!raw) return null;
      const start = Number(seg?.start_time);
      if (!Number.isFinite(start)) return null;
      const end = Number(seg?.end_time);
      const duration = Number.isFinite(end)
        ? Math.max(0.05, end! - start)
        : 1.2;
      return {
        id: i + 1,
        sender: (
          seg?.speaker?.name ||
          seg?.speaker?.id ||
          `Speaker ${i % 2}`
        ).trim(),
        message: raw,
        timestamp: start,
        duration,
      } as ChatMessage;
    })
    .filter((m): m is ChatMessage => !!m)
    .sort((a, b) => a.timestamp - b.timestamp);
}

function normalizeSequential(messages: ChatMessage[]): ChatMessage[] {
  let cursor = 0;
  return messages.map((m, i) => {
    const charDur = typeDurationFor(m.message);
    const start = cursor;
    const duration = Math.max(charDur, m.duration);
    cursor = start + duration; 
    return {
      ...m,
      id: i + 1,
      timestamp: start,
      duration,
    };
  });
}

function buildPersonas(
  messages: ChatMessage[],
  avatars?: { left?: string; right?: string }
): Record<string, Persona> {
  const order: string[] = [];
  const seen = new Set<string>();
  for (const m of messages) {
    if (!seen.has(m.sender)) {
      seen.add(m.sender);
      order.push(m.sender);
    }
  }

  const personas: Record<string, Persona> = {};
  order.forEach((name, idx) => {
    const p: Persona = {
      name,
      color: COLORS[idx % COLORS.length],
      position: idx % 2 === 0 ? "left" : "right",
    };

    if (p.position === "left" && avatars?.left) {
      p.avatar = avatars.left;
    }
    if (p.position === "right" && avatars?.right) {
      p.avatar = avatars.right;
    }

    personas[name] = p;
  });
  return personas;
}

function typeDurationFor(text: string) {
  const charDuration = 0.045 * text.length + 0.35;
  return clamp(charDuration, 0.6, 2.8);
}

const ChatBubble: React.FC<{
  message: ChatMessage;
  persona: Persona;
  nowSec: number;
  timeShiftSec: number;
  fontFamily: string;
  fontSize: number;
  fontColor: string;
  theme: Theme;
}> = ({
  message,
  persona,
  nowSec,
  timeShiftSec,
  fontFamily,
  fontSize,
  fontColor,
  theme,
}) => {
  const AVATAR_SIZE = 80;
  const start = message.timestamp + timeShiftSec;
  const typeDur = typeDurationFor(message.message);

  if (nowSec < start) return null;

  const t = clamp((nowSec - start) / typeDur, 0, 1);
  const chars = Math.floor(message.message.length * t);
  const visibleText = message.message.slice(0, chars);
  const typing = t < 1;

  const tailBase: React.CSSProperties = {
    position: "absolute",
    bottom: 16,
    width: 0,
    height: 0,
    borderTop: `20px solid ${
      persona.position === "right" ? theme.rightBubble : theme.leftBubble
    }`,
  };
  const tailPos: React.CSSProperties =
    persona.position === "right"
      ? { right: -12, borderLeft: "20px solid transparent" }
      : { left: -12, borderRight: "20px solid transparent" };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: persona.position === "right" ? "row-reverse" : "row",
        alignItems: "flex-end",
        gap: 18,
        marginBottom: 24,
        padding: "0 36px",
      }}
    >
      <div
        style={{
          width: AVATAR_SIZE,
          height: AVATAR_SIZE,
          borderRadius: AVATAR_SIZE / 2,
          overflow: "hidden",
          border: `4px solid ${persona.color}`,
          backgroundColor: "#fff",
          flexShrink: 0,
          boxShadow: "0 6px 18px rgba(0,0,0,0.15)",
        }}
      >
        {persona.avatar ? (
          <img
            src={persona.avatar}
            alt={persona.name}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <div
            style={{ width: "100%", height: "100%", background: persona.color }}
          />
        )}
      </div>

      <div
        style={{
          maxWidth: "80%",
          backgroundColor:
            persona.position === "right" ? theme.rightBubble : theme.leftBubble,
          color:
            fontColor ||
            (persona.position === "right" ? theme.rightText : theme.leftText),
          borderRadius: 28,
          padding: "20px 28px",
          fontSize,
          lineHeight: 1.6,
          fontFamily,
          fontWeight: 600,
          boxShadow: "0 8px 22px rgba(0,0,0,0.18)",
          position: "relative",
          whiteSpace: "pre-wrap",
        }}
      >
        <span>{visibleText}</span>
        {typing && (
          <span
            style={{
              display: "inline-block",
              width: 12,
              marginLeft: 4,
              borderBottom: `3px solid ${
                persona.position === "right" ? theme.rightText : theme.leftText
              }`,
              animation: "blink 1s step-end infinite",
              transform: "translateY(-2px)",
            }}
          />
        )}
        <div style={{ ...tailBase, ...tailPos }} />
      </div>
    </div>
  );
};

export const ChatVideo2: React.FC<ChatVideoProps> = ({
  chatdata = defaultchats,
  bgVideo = "bg.mp4",
  chatAudio = "chat.mp3",
  musicAudio = "music.mp3",
  musicBase = 0.12,
  musicWhileTalking = 0.06,
  duckAttackMs = 120,
  duckReleaseMs = 240,
  timeShiftSec = 0,
  fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  fontSize = 28,
  fontColor = "",
  chatTheme = "default",
  avatars,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  const [chatData, setChatData] = useState<ChatMessage[] | null>(null);

  const [bgAvailable, setBgAvailable] = useState(true);
  const [bgFailed, setBgFailed] = useState(false);
  const [chatAudioAvailable, setChatAudioAvailable] = useState(true);
  const [musicAudioAvailable, setMusicAudioAvailable] = useState(true);

  const cardOpacityBase = interpolate(frame, [0, 40], [0, 1], {
    extrapolateRight: "clamp",
  });
  const cardScale = interpolate(frame, [0, 40], [0.92, 1], {
    extrapolateRight: "clamp",
  });

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const raw = chatdata;
        const data: ChatMessage[] = Array.isArray(raw)
          ? (raw as any[]).map((m, i) => ({
              id: Number(m.id ?? i + 1),
              sender: String(m.sender ?? `Speaker ${i % 2}`),
              message: String(m.message ?? "").trim(),
              timestamp: Number(m.timestamp ?? 0),
              duration: Number.isFinite(Number(m.duration))
                ? Number(m.duration)
                : 1.2,
            }))
          : transcriptToChat(raw as TranscriptJson);

        if (mounted) setChatData(data);
      } catch (e) {
        console.warn("Failed to parse chat JSON", e as any);
        if (mounted) setChatData([]);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [chatdata]);

  useEffect(() => {
    let cancelled = false;
    const check = async (
      file: string | undefined,
      setOK: (ok: boolean) => void
    ) => {
      if (!file) return setOK(false);
      try {
        const url = file;
        const res = await fetch(url, { method: "HEAD" });
        if (!cancelled) setOK(res.ok || res.status === 405);
      } catch {
        if (!cancelled) setOK(false);
      }
    };
    check(bgVideo, setBgAvailable);
    check(chatAudio, setChatAudioAvailable);
    check(musicAudio, setMusicAudioAvailable);
    return () => {
      cancelled = true;
    };
  }, [bgVideo, chatAudio, musicAudio]);

  const messages = useMemo(() => {
    const base = Array.isArray(chatData) ? chatData : [];
    return normalizeSequential(base);
  }, [chatData]);

  const personas = useMemo(
    () => buildPersonas(messages, avatars),
    [messages, avatars]
  );
  const theme = THEMES[chatTheme] || THEMES.default;

  const nowSec = frame / fps;

  const firstStart = (messages[0]?.timestamp ?? 0) + timeShiftSec;
  const gate = clamp(
    interpolate(nowSec, [firstStart - 0.15, firstStart + 0.15], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }),
    0,
    1
  );
  const cardOpacity = cardOpacityBase * gate;

  const talkingNow = useMemo(
    () =>
      messages.some((m) => {
        const s = m.timestamp + timeShiftSec;
        const e = s + m.duration;
        return nowSec >= s && nowSec <= e;
      }),
    [messages, nowSec, timeShiftSec]
  );

  const musicVol = useMemo(() => {
    const nearest = messages.reduce((acc, m) => {
      const s = m.timestamp + timeShiftSec;
      const e = s + m.duration;
      const dist = Math.min(Math.abs(nowSec - s), Math.abs(nowSec - e));
      return Math.min(acc, dist);
    }, Infinity);

    const attackS = Math.max(0.01, duckAttackMs / 1000);
    const releaseS = Math.max(0.01, duckReleaseMs / 1000);
    const window = talkingNow ? attackS : releaseS;

    const k =
      nearest < window
        ? interpolate(nearest, [0, window], [0, 1], {
            easing: Easing.ease,
            extrapolateRight: "clamp",
          })
        : 1;

    const target = talkingNow ? musicWhileTalking : musicBase;
    const other = talkingNow ? musicBase : musicWhileTalking;
    return clamp(target * k + other * (1 - k), 0, 1);
  }, [
    messages,
    nowSec,
    talkingNow,
    timeShiftSec,
    musicBase,
    musicWhileTalking,
    duckAttackMs,
    duckReleaseMs,
  ]);

  const CARD_WIDTH = Math.min(860, Math.max(640, Math.floor(width * 0.74)));
  const CARD_MAX_HEIGHT = Math.floor(height * 0.9);

  return (
    <AbsoluteFill style={{ backgroundColor: "#0b0b0b" }}>
      {bgAvailable && !bgFailed ? (
        <Video
          src={bgVideo}
          muted
          loop
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            opacity: 0.28,
          }}
          onError={() => setBgFailed(true)}
          delayRenderTimeoutInMilliseconds={20000}
          delayRenderRetries={1}
        />
      ) : (
        <AbsoluteFill
          style={{
            background:
              "linear-gradient(180deg, #0b0b0b 0%, #101010 40%, #0b0b0b 100%)",
          }}
        />
      )}

      <AbsoluteFill
        style={{
          background:
            "radial-gradient(80% 60% at 50% 40%, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.55) 60%, rgba(0,0,0,0.75) 100%)",
        }}
      />

      <style>{`
        @keyframes blink {
          0%, 100% { opacity: 0 }
          50% { opacity: 1 }
        }
      `}</style>

      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: `translate(-50%, -50%) scale(${cardScale})`,
          width: CARD_WIDTH,
          height: "auto",
          maxHeight: CARD_MAX_HEIGHT,
          background: "rgba(0,0,0,0.28)",
          borderRadius: 34,
          padding: 18,
          display: "flex",
          flexDirection: "column",
          zIndex: 2,
          opacity: cardOpacity,
          border: "1px solid rgba(255,255,255,0.18)",
          boxShadow: "0 24px 48px rgba(0,0,0,0.45)",
          backdropFilter: "blur(14px) saturate(1.2)",
          overflow: "hidden",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "24px 0 12px 0" }}>
            {messages.map((m) => (
              <ChatBubble
                key={m.id}
                message={m}
                persona={personas[m.sender]}
                nowSec={nowSec}
                timeShiftSec={timeShiftSec}
                fontFamily={fontFamily}
                fontSize={fontSize}
                fontColor={fontColor}
                theme={theme}
              />
            ))}
          </div>
        </div>
      </div>

      {chatAudioAvailable && <Audio src={chatAudio} />}
      {musicAudioAvailable && (
        <Audio src={musicAudio} volume={musicVol} />
      )}
    </AbsoluteFill>
  );
};
