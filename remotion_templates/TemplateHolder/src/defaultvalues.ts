import { TypographyConfig } from "./components/KineticText";
import { LogoLiquidOverlayProps } from "./components/LogoAnimation";

const flipcardsdefaulvalues = {
  title: "Project Key Metrics",
  subtitle: "This Quarter vs. Last Quarter",
  metrics: [
    { front: "1,204\nNew Users", back: "+15.2%\nvs. Q2", color: "#3b82f6" },
    { front: "72.5%\nConversion", back: "-0.8%\nvs. Q2", color: "#10b981" },
    { front: "$42,800\nRevenue", back: "+22.0%\nvs. Q2", color: "#f59e0b" },
  ],
  flipDuration: 0.8,
  spacing: 20,
  cardWidth: 0,
  backgroundGradient: ["#0f0f23", "#1a1a2e", "#16213e"],
};

const logoanimationdefaultvalues: LogoLiquidOverlayProps = {
  text: "SHAKER",
  durationOutline: 2,
  durationFill: 2.5,
  baseColor: "#FFD700",
  durationEndPause: 2,
};

const quoetTemplateDefaultValues = {
  quote: "Your Quote",
  author: "Author",
  backgroundImage:
    "https://res.cloudinary.com/dnxc1lw18/image/upload/v1760979564/bg12_z53lpr.jpg",
  fontFamily: "Arial, sans-serif",
  fontSize: 1,
  fontColor: "white",
};

const storyTellingDefaultValues = {
  voiceoverPath:
    "https://rsnemknhybirnaxoffur.supabase.co/storage/v1/object/public/Remotion%20Web%20App%20file%20bucket/audios/story/story-1761121205638.mp3",
  duration: 13,
  fontSize: 72,
  fontFamily: "'Oleo Script', system-ui",
  fontColor: "#ffffff",
  sentenceBgColor: "#ff8c00",
  backgroundVideo:
    "https://res.cloudinary.com/dnxc1lw18/video/upload/v1760964407/m7_jrjns5.mp4",
  backgroundMusicPath:
    "https://rsnemknhybirnaxoffur.supabase.co/storage/v1/object/public/Remotion%20Web%20App%20file%20bucket/bgmusics/bg3.mp3",
  script: {
    story:
      "Their eyes met across the crowded room, a silent promise exchanged that would redefine their lives forever. In that stolen moment, a love story began, destined to be etched in the stars.",
    duration: 12.564875,
    words: [
      {
        word: "Their",
        start: 0.099,
        end: 0.319,
      },
      {
        word: " ",
        start: 0.319,
        end: 0.379,
      },
      {
        word: "eyes",
        start: 0.379,
        end: 0.62,
      },
      {
        word: " ",
        start: 0.62,
        end: 0.699,
      },
      {
        word: "met",
        start: 0.699,
        end: 0.799,
      },
      {
        word: " ",
        start: 0.799,
        end: 0.899,
      },
      {
        word: "across",
        start: 0.899,
        end: 1.179,
      },
      {
        word: " ",
        start: 1.179,
        end: 1.22,
      },
      {
        word: "the",
        start: 1.22,
        end: 1.299,
      },
      {
        word: " ",
        start: 1.299,
        end: 1.339,
      },
      {
        word: "crowded",
        start: 1.339,
        end: 1.679,
      },
      {
        word: " ",
        start: 1.679,
        end: 1.779,
      },
      {
        word: "room,",
        start: 1.779,
        end: 1.999,
      },
      {
        word: " ",
        start: 1.999,
        end: 2.579,
      },
      {
        word: "a",
        start: 2.579,
        end: 2.679,
      },
      {
        word: " ",
        start: 2.679,
        end: 2.779,
      },
      {
        word: "silent",
        start: 2.779,
        end: 3.099,
      },
      {
        word: " ",
        start: 3.099,
        end: 3.159,
      },
      {
        word: "promise",
        start: 3.159,
        end: 3.48,
      },
      {
        word: " ",
        start: 3.48,
        end: 3.559,
      },
      {
        word: "exchanged",
        start: 3.559,
        end: 4.059,
      },
      {
        word: " ",
        start: 4.059,
        end: 4.119,
      },
      {
        word: "that",
        start: 4.119,
        end: 4.219,
      },
      {
        word: " ",
        start: 4.219,
        end: 4.239,
      },
      {
        word: "would",
        start: 4.239,
        end: 4.38,
      },
      {
        word: " ",
        start: 4.38,
        end: 4.48,
      },
      {
        word: "redefine",
        start: 4.48,
        end: 5.039,
      },
      {
        word: " ",
        start: 5.039,
        end: 5.059,
      },
      {
        word: "their",
        start: 5.059,
        end: 5.279,
      },
      {
        word: " ",
        start: 5.279,
        end: 5.319,
      },
      {
        word: "lives",
        start: 5.319,
        end: 5.699,
      },
      {
        word: " ",
        start: 5.699,
        end: 5.759,
      },
      {
        word: "forever.",
        start: 5.759,
        end: 6.219,
      },
      {
        word: " ",
        start: 6.219,
        end: 7.319,
      },
      {
        word: "In",
        start: 7.319,
        end: 7.419,
      },
      {
        word: " ",
        start: 7.419,
        end: 7.46,
      },
      {
        word: "that",
        start: 7.46,
        end: 7.619,
      },
      {
        word: " ",
        start: 7.619,
        end: 7.719,
      },
      {
        word: "stolen",
        start: 7.719,
        end: 8.139,
      },
      {
        word: " ",
        start: 8.139,
        end: 8.179,
      },
      {
        word: "moment,",
        start: 8.179,
        end: 8.579,
      },
      {
        word: " ",
        start: 8.579,
        end: 8.859,
      },
      {
        word: "a",
        start: 8.859,
        end: 8.96,
      },
      {
        word: " ",
        start: 8.96,
        end: 9.019,
      },
      {
        word: "love",
        start: 9.019,
        end: 9.139,
      },
      {
        word: " ",
        start: 9.139,
        end: 9.239,
      },
      {
        word: "story",
        start: 9.239,
        end: 9.539,
      },
      {
        word: " ",
        start: 9.539,
        end: 9.579,
      },
      {
        word: "began,",
        start: 9.579,
        end: 9.96,
      },
      {
        word: " ",
        start: 9.96,
        end: 10.559,
      },
      {
        word: "destined",
        start: 10.559,
        end: 10.96,
      },
      {
        word: " ",
        start: 10.96,
        end: 10.979,
      },
      {
        word: "to",
        start: 10.979,
        end: 11.06,
      },
      {
        word: " ",
        start: 11.06,
        end: 11.099,
      },
      {
        word: "be",
        start: 11.099,
        end: 11.199,
      },
      {
        word: " ",
        start: 11.199,
        end: 11.239,
      },
      {
        word: "etched",
        start: 11.239,
        end: 11.46,
      },
      {
        word: " ",
        start: 11.46,
        end: 11.479,
      },
      {
        word: "in",
        start: 11.479,
        end: 11.559,
      },
      {
        word: " ",
        start: 11.559,
        end: 11.599,
      },
      {
        word: "the",
        start: 11.599,
        end: 11.659,
      },
      {
        word: " ",
        start: 11.659,
        end: 11.739,
      },
      {
        word: "stars.",
        start: 11.739,
        end: 12.239,
      },
    ],
  },
};

const redditDefaultValues = {
  script: {
    story:
      "Fake news yung Mark Alcala with Kb sa Aivee lol. It was someone who works for Aivee. Lahat tayo uhaw sa chismis pero we have another woman getting bashed online dahil sa maling info pinapakalat ng haters tas pag nabalitaang nadepress biglang delete ng post noh lol",
    duration: 20.610563,
    words: [
      {
        word: "Fake",
        start: 0.179,
        end: 0.419,
      },
      {
        word: " ",
        start: 0.419,
        end: 0.519,
      },
      {
        word: "news",
        start: 0.519,
        end: 0.839,
      },
      {
        word: " ",
        start: 0.839,
        end: 0.879,
      },
      {
        word: "yung",
        start: 0.879,
        end: 1.079,
      },
      {
        word: " ",
        start: 1.079,
        end: 1.12,
      },
      {
        word: "Mark",
        start: 1.12,
        end: 1.339,
      },
      {
        word: " ",
        start: 1.339,
        end: 1.419,
      },
      {
        word: "Alcala",
        start: 1.419,
        end: 1.979,
      },
      {
        word: " ",
        start: 1.979,
        end: 2.039,
      },
      {
        word: "with",
        start: 2.039,
        end: 2.22,
      },
      {
        word: " ",
        start: 2.22,
        end: 2.279,
      },
      {
        word: "Kb",
        start: 2.279,
        end: 2.7,
      },
      {
        word: " ",
        start: 2.7,
        end: 2.819,
      },
      {
        word: "sa",
        start: 2.819,
        end: 3.139,
      },
      {
        word: " ",
        start: 3.139,
        end: 3.22,
      },
      {
        word: "Aivee",
        start: 3.22,
        end: 3.579,
      },
      {
        word: " ",
        start: 3.579,
        end: 3.659,
      },
      {
        word: "lol.",
        start: 3.659,
        end: 4.019,
      },
      {
        word: " ",
        start: 4.019,
        end: 4.92,
      },
      {
        word: "It",
        start: 4.92,
        end: 5.019,
      },
      {
        word: " ",
        start: 5.019,
        end: 5.079,
      },
      {
        word: "was",
        start: 5.079,
        end: 5.239,
      },
      {
        word: " ",
        start: 5.239,
        end: 5.299,
      },
      {
        word: "someone",
        start: 5.299,
        end: 5.599,
      },
      {
        word: " ",
        start: 5.599,
        end: 5.679,
      },
      {
        word: "who",
        start: 5.679,
        end: 5.799,
      },
      {
        word: " ",
        start: 5.799,
        end: 5.859,
      },
      {
        word: "works",
        start: 5.859,
        end: 6.079,
      },
      {
        word: " ",
        start: 6.079,
        end: 6.159,
      },
      {
        word: "for",
        start: 6.159,
        end: 6.319,
      },
      {
        word: " ",
        start: 6.319,
        end: 6.42,
      },
      {
        word: "Aivee.",
        start: 6.42,
        end: 6.799,
      },
      {
        word: " ",
        start: 6.799,
        end: 7.619,
      },
      {
        word: "Lahat",
        start: 7.619,
        end: 7.96,
      },
      {
        word: " ",
        start: 7.96,
        end: 7.98,
      },
      {
        word: "tayo",
        start: 7.98,
        end: 8.26,
      },
      {
        word: " ",
        start: 8.26,
        end: 8.359,
      },
      {
        word: "uhaw",
        start: 8.359,
        end: 8.76,
      },
      {
        word: " ",
        start: 8.76,
        end: 8.84,
      },
      {
        word: "sa",
        start: 8.84,
        end: 8.979,
      },
      {
        word: " ",
        start: 8.979,
        end: 9.019,
      },
      {
        word: "chismis",
        start: 9.019,
        end: 9.579,
      },
      {
        word: " ",
        start: 9.579,
        end: 10,
      },
      {
        word: "pero",
        start: 10,
        end: 10.219,
      },
      {
        word: " ",
        start: 10.219,
        end: 10.279,
      },
      {
        word: "we",
        start: 10.279,
        end: 10.399,
      },
      {
        word: " ",
        start: 10.399,
        end: 10.439,
      },
      {
        word: "have",
        start: 10.439,
        end: 10.579,
      },
      {
        word: " ",
        start: 10.579,
        end: 10.639,
      },
      {
        word: "another",
        start: 10.639,
        end: 11.019,
      },
      {
        word: " ",
        start: 11.019,
        end: 11.159,
      },
      {
        word: "woman",
        start: 11.159,
        end: 11.399,
      },
      {
        word: " ",
        start: 11.399,
        end: 11.519,
      },
      {
        word: "getting",
        start: 11.519,
        end: 11.76,
      },
      {
        word: " ",
        start: 11.76,
        end: 11.859,
      },
      {
        word: "bashed",
        start: 11.859,
        end: 12.199,
      },
      {
        word: " ",
        start: 12.199,
        end: 12.279,
      },
      {
        word: "online",
        start: 12.279,
        end: 12.739,
      },
      {
        word: " ",
        start: 12.739,
        end: 13.119,
      },
      {
        word: "dahil",
        start: 13.119,
        end: 13.38,
      },
      {
        word: " ",
        start: 13.38,
        end: 13.46,
      },
      {
        word: "sa",
        start: 13.46,
        end: 13.5,
      },
      {
        word: " ",
        start: 13.5,
        end: 13.599,
      },
      {
        word: "maling",
        start: 13.599,
        end: 13.859,
      },
      {
        word: " ",
        start: 13.859,
        end: 13.939,
      },
      {
        word: "info",
        start: 13.939,
        end: 14.199,
      },
      {
        word: " ",
        start: 14.199,
        end: 14.259,
      },
      {
        word: "pinapakalat",
        start: 14.259,
        end: 14.96,
      },
      {
        word: " ",
        start: 14.96,
        end: 14.979,
      },
      {
        word: "ng",
        start: 14.979,
        end: 15.139,
      },
      {
        word: " ",
        start: 15.139,
        end: 15.179,
      },
      {
        word: "haters",
        start: 15.179,
        end: 15.639,
      },
      {
        word: " ",
        start: 15.639,
        end: 15.979,
      },
      {
        word: "tas",
        start: 15.979,
        end: 16.159,
      },
      {
        word: " ",
        start: 16.159,
        end: 16.18,
      },
      {
        word: "pag",
        start: 16.18,
        end: 16.319,
      },
      {
        word: " ",
        start: 16.319,
        end: 16.379,
      },
      {
        word: "nabalitaang",
        start: 16.379,
        end: 17.039,
      },
      {
        word: " ",
        start: 17.039,
        end: 17.079,
      },
      {
        word: "nadepress",
        start: 17.079,
        end: 17.68,
      },
      {
        word: " ",
        start: 17.68,
        end: 18.02,
      },
      {
        word: "biglang",
        start: 18.02,
        end: 18.399,
      },
      {
        word: " ",
        start: 18.399,
        end: 18.44,
      },
      {
        word: "delete",
        start: 18.44,
        end: 18.739,
      },
      {
        word: " ",
        start: 18.739,
        end: 18.779,
      },
      {
        word: "ng",
        start: 18.779,
        end: 19,
      },
      {
        word: " ",
        start: 19,
        end: 19.039,
      },
      {
        word: "post",
        start: 19.039,
        end: 19.379,
      },
      {
        word: " ",
        start: 19.379,
        end: 19.699,
      },
      {
        word: "noh",
        start: 19.699,
        end: 19.979,
      },
      {
        word: " ",
        start: 19.979,
        end: 20.059,
      },
      {
        word: "lol",
        start: 20.059,
        end: 20.579,
      },
    ],
    title: "Fake news yung Mark Alcala with Kb sa Aivee lol",
    text: "It was someone who works for Aivee. Lahat tayo uhaw sa chismis pero we have another woman getting bashed online dahil sa maling info pinapakalat ng haters tas pag nabalitaang nadepress biglang delete ng post noh lol ",
  },
  voiceoverPath:
    "https://rsnemknhybirnaxoffur.supabase.co/storage/v1/object/public/Remotion%20Web%20App%20file%20bucket/audios/reddit/reddit-1761120621758.mp3",
  duration: 18,
  fontSize: 61,
  fontFamily: "'Russo One', sans-serif",
  fontColor: "#ffffff",
  sentenceBgColor: "#ff8c00",
  backgroundVideo:
    "https://res.cloudinary.com/dnxc1lw18/video/upload/v1760964409/m8_jttvu0.mp4",
  backgroundMusicPath:
    "https://rsnemknhybirnaxoffur.supabase.co/storage/v1/object/public/Remotion%20Web%20App%20file%20bucket/bgmusics/bg11.mp3",
};

const textTypingDefaultValues = {
  phrase: {
    lines: ["Dream big, start small", "but start today"],
    category: "wisdom",
    mood: "iconic",
  },
  backgroundIndex: 10,
  fontIndex: 1,
  audioIndex: 1,
};

const splitScreenDefaultValues = {
  bottomHeightPercent: 50,
  bottomOpacity: 1,
  bottomVideoUrl:
    "https://res.cloudinary.com/dnxc1lw18/video/upload/v1760964408/m5_ktreoe.mp4",
  bottomVolume: 0,
  swap: false,
  topHeightPercent: 50,
  topOpacity: 1,
  topVideoUrl:
    "https://res.cloudinary.com/dnxc1lw18/video/upload/v1761069726/videos/video_8b31ce65-c80a-4864-8d75-390056969637.mp4",
  topVolume: 1,
  duration: 4,
};

const kenburnsDefaultValues = {
  images: [
    "https://res.cloudinary.com/dnxc1lw18/image/upload/v1761129731/kenburns/kenburns_9927743b-d42e-44c1-a144-0383df574eb1.jpg",
    "https://res.cloudinary.com/dnxc1lw18/image/upload/v1761129732/kenburns/kenburns_9c6e7665-3f95-4ed4-bce6-d814c9088cc6.jpg",
  ],
  cardWidthRatio: 0.75,
  cardHeightRatio: 0.75,
  duration: 6,
};

const fakeTextDefaultValues = {
  chatdata: {
    language_code: "eng",
    segments: [
      {
        text: "Hey, have you tried The Green Fork yet?",
        start_time: 0,
        end_time: 2.220375,
        speaker: {
          id: "person_1",
          name: "person 1",
        },
      },
      {
        text: "Not yet. Is it any good?",
        start_time: 2.220375,
        end_time: 4.075063,
        speaker: {
          id: "person_2",
          name: "person 2",
        },
      },
    ],
  },
  bgVideo:
    "https://res.cloudinary.com/dnxc1lw18/video/upload/v1760964769/ss4_yvpblt.mp4",
  chatAudio:
    "https://rsnemknhybirnaxoffur.supabase.co/storage/v1/object/public/Remotion%20Web%20App%20file%20bucket/audios/fakeconvo/fakeconvo-1761133080579.mp3",
  musicAudio:
    "https://rsnemknhybirnaxoffur.supabase.co/storage/v1/object/public/Remotion%20Web%20App%20file%20bucket/bgmusics/bg10.mp3",
  musicBase: 0.12,
  musicWhileTalking: 0.06,
  duckAttackMs: 120,
  duckReleaseMs: 240,
  timeShiftSec: 0,
  fontFamily: "Inter, sans-serif",
  fontSize: 28,
  fontColor: "",
  chatTheme: "discord",
  avatars: {
    left: "https://res.cloudinary.com/dnxc1lw18/image/upload/v1760977048/v7_njhvnm.avif",
    right:
      "https://res.cloudinary.com/dnxc1lw18/image/upload/v1760977048/v10_lzbfv0.jpg",
  },
};

const barGraphDefaultValues = {
  data: [
    {
      name: "2020",
      value: 15000,
    },
    {
      name: "2021",
      value: 18000,
    },
    {
      name: "2022",
      value: 21000,
    },
    {
      name: "2023",
      value: 25000,
    },
    {
      name: "2024",
      value: 30000,
    },
  ],
  title: "Annual Revenue Over Years",
  titleFontColor: "white",
  backgroundImage:
    "https://res.cloudinary.com/dnxc1lw18/image/upload/v1760979564/bg12_z53lpr.jpg",
  accent: "#3B82F6",
  subtitle: "A record of revenue figures from 2020 to 2024",
  currency: "",
  titleFontSize: 78,
  subtitleFontSize: 48,
  subtitleColor: "white",
  barHeight: 100,
  barGap: 36,
  barLabelFontSize: 36,
  barValueFontSize: 36,
  fontFamily: "Kode Mono, monospace",
  duration: 8,
};

const curveLineTrendDefaultValues = {
  title: "Revenue Growth",
  subtitle: "2015–2024 • Journey",
  titleFontSize: 50,
  subtitleFontSize: 30,
  fontFamily: "Arial, sans-serif",
  data: [
    {
      label: 2015,
      value: 100,
    },
    {
      label: 2016,
      value: 150,
    },
    {
      label: 2017,
      value: 300,
    },
    {
      label: 2018,
      value: 200,
    },
    {
      label: 2019,
      value: 250,
    },
    {
      label: 2020,
      value: 400,
    },
    {
      label: 2021,
      value: 550,
    },
    {
      label: 2022,
      value: 450,
    },
    {
      label: 2023,
      value: 600,
    },
    {
      label: 2024,
      value: 750,
    },
  ],
  dataType: "$",
  preset: "corporate",
  backgroundImage: "",
  animationSpeed: "normal",
  minimalMode: false,
  duration: 13,
};

const facstCardDefaultValues = {
  intro: {
    title: "Interesting Facts",
    subtitle: "A collection of diverse and fascinating facts.",
  },
  outro: {
    title: "Interesting Facts",
    subtitle: "A collection of diverse and fascinating facts.",
  },
  facts: [
    {
      title: "Honey Never Spoils",
      description:
        "Honey never spoils — archaeologists found edible honey in ancient Egyptian tombs.",
    },
    {
      title: "Octopus Anatomy",
      description: "Octopuses have three hearts and blue blood.",
    },
    {
      title: "Venus's Day and Year",
      description: "A day on Venus is longer than a year on Venus.",
    },
    {
      title: "Canada's Coastline",
      description:
        "Canada has the longest coastline of any country in the world.",
    },
    {
      title: "Shortest War",
      description:
        "The shortest war in history lasted 38–45 minutes (Anglo-Zanzibar War, 1896).",
    },
    {
      title: "Word 'Set'",
      description:
        "The word 'set' has one of the highest numbers of distinct meanings in English.",
    },
    {
      title: "Flamingo Groups",
      description: "A group of flamingos is called a 'flamboyance'.",
    },
    {
      title: "Tomatoes in Europe",
      description:
        "Tomatoes were once considered poisonous in Europe for centuries.",
    },
    {
      title: "First Computer Bug",
      description:
        "The first computer bug was an actual moth found in a Harvard computer in 1947.",
    },
    {
      title: "Absolute Zero",
      description:
        "Absolute zero (0 K) is the theoretical temperature where particles have minimal vibrational motion.",
    },
    {
      title: "Bananas and Berries",
      description:
        "Bananas are berries, while strawberries are not true berries.",
    },
    {
      title: "Bone Remodeling",
      description:
        "Bones are constantly being remodeled; every 7–10 years many bones are replaced at the cellular level.",
    },
    {
      title: "Nintendo's Origin",
      description:
        "Nintendo started in 1889 as a Japanese playing-card company.",
    },
    {
      title: "Modern Olympics",
      description:
        "The modern Olympic Games were revived in 1896 in Athens, Greece.",
    },
    {
      title: "Largest Deserts",
      description:
        "The world's largest hot desert is the Sahara, but Antarctica is the largest cold desert.",
    },
    {
      title: "Shortest Song",
      description:
        "The shortest commercially released song is 'You Suffer' by Napalm Death — 1.316 seconds.",
    },
    {
      title: "Fastest Growing Plants",
      description:
        "Bamboo can be one of the fastest-growing plants — some species grow over 90 cm (35 in) per day.",
    },
    {
      title: "Serial Position Effect",
      description:
        "Humans are more likely to remember the first and last items in a list (the serial position effect).",
    },
    {
      title: "Chocolate as Currency",
      description: "Chocolate was used as currency by the ancient Aztecs.",
    },
    {
      title: "First Passenger Railway",
      description:
        "The world's first passenger railway opened in 1825 between Stockton and Darlington in England.",
    },
    {
      title: "Water Expansion",
      description: "Water expands when it freezes, which is why ice floats.",
    },
    {
      title: "Neutron Star Density",
      description:
        "Neutron stars are so dense that a teaspoon of their material would weigh billions of tons on Earth.",
    },
    {
      title: "Symbol of Peace",
      description:
        "The white dove became a symbol of peace in modern times after Picasso's lithograph in 1949.",
    },
    {
      title: "First High-Level Language",
      description:
        "The first high-level programming language often considered 'Fortran' was released in the 1950s.",
    },
    {
      title: "Elephants Can't Jump",
      description: "Elephants are the only mammals that can't jump.",
    },
    {
      title: "Number of Languages",
      description: "There are about 7,000 languages spoken in the world today.",
    },
    {
      title: "Apple Tree Fruiting",
      description:
        "Apple trees can take 4–5 years to produce their first fruit from seed.",
    },
    {
      title: "Great Wall of China",
      description:
        "The Great Wall of China is not a single continuous wall — it's a series of walls and fortifications built over centuries.",
    },
    {
      title: "Microwave Oven Invention",
      description:
        "The microwave oven was invented accidentally after engineer Percy Spencer noticed a chocolate bar melted in his pocket near radar equipment.",
    },
    {
      title: "Cleopatra Timeline",
      description:
        "Cleopatra lived closer in time to the Moon landing (1969) than to the construction of the Great Pyramid of Giza.",
    },
  ],
  backgroundImage:
    "https://res.cloudinary.com/dnxc1lw18/image/upload/v1760979564/bg12_z53lpr.jpg",
  fontSizeTitle: 68,
  fontSizeSubtitle: 49,
  fontFamilyTitle: "Arial, sans-serif",
  fontColorTitle: "white",
  fontColorSubtitle: "white",
  fontFamilySubtitle: "Arial, sans-serif",
  duration: 128,
};

const kpiFlipCardsDefaultValues = {
  backgroundImage:
    "https://res.cloudinary.com/dnxc1lw18/image/upload/v1760979562/bg6_mtqtio.jpg",
  title: "Revenue Over Years",
  titleFontSize: 93,
  titleFontColor: "pink",
  titleFontFamily: "Arial, sans-serif",
  subtitle: "Annual Revenue Data",
  subtitleFontSize: 36,
  subtitleFontColor: "pink",
  subtitleFontFamily: "Arial, sans-serif",
  cardsData: [
    {
      front: {
        label: "2020",
        value: "15000",
        color: "white",
      },
      back: {
        label: "Revenue",
        value: "15000",
        color: "white",
      },
    },
    {
      front: {
        label: "2021",
        value: "18000",
        color: "white",
      },
      back: {
        label: "Revenue",
        value: "18000",
        color: "white",
      },
    },
    {
      front: {
        label: "2022",
        value: "21000",
        color: "white",
      },
      back: {
        label: "Revenue",
        value: "21000",
        color: "white",
      },
    },
    {
      front: {
        label: "2023",
        value: "25000",
        color: "white",
      },
      back: {
        label: "Revenue",
        value: "25000",
        color: "white",
      },
    },
    {
      front: {
        label: "2024",
        value: "30000",
        color: "white",
      },
      back: {
        label: "Revenue",
        value: "30000",
        color: "white",
      },
    },
  ],
  cardWidth: 360,
  cardHeight: 220,
  cardBorderRadius: 28,
  cardBorderColor: "white",
  cardLabelColor: "white",
  cardLabelFontSize: 14,
  cardContentFontFamily: "Arial, sans-serif",
  cardGrid: {
    rows: 2,
    cols: 2,
  },
  delayStart: 0.5,
  delayStep: 1,
  cardColorBack: "black",
  cardColorFront: "gray",
  valueFontSize: 20,
};

const defaultConfig: TypographyConfig = {
  id: "default-kinetic-v1",
  words: ["KINETIC", "TYPOGRAPHY"],
  colors: {
    primary: "#00f2ff",
    secondary: "#ff4fa3",
    accent: "#ffffff",
  },
  timing: {
    staggerDelay: 5,
    collisionFrame: 45,
    explosionDelay: 20,
  },
  effects: {
    shakeIntensity: 12,
    particleCount: 70,
    ballSize: 120,
  },
};

export {
  flipcardsdefaulvalues,
  logoanimationdefaultvalues,
  quoetTemplateDefaultValues,
  textTypingDefaultValues,
  facstCardDefaultValues,
  defaultConfig,
  kpiFlipCardsDefaultValues,
  barGraphDefaultValues,
  curveLineTrendDefaultValues,
  kenburnsDefaultValues,
  splitScreenDefaultValues,
  redditDefaultValues,
  storyTellingDefaultValues,
  fakeTextDefaultValues,
};
