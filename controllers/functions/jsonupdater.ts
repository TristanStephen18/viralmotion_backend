import fs from "fs";
import path from "path";
import { soundurlReplacer } from "./soundandfontsize.ts";
// import { duration } from '@mui/material';

//json file updater for quotedata
export function updateJsonfile_QuoteData(
  quote: string,
  author: string,
  backgroundImage: string,
  fontFamily: string,
  fontSize: number,
  fontColor:string
) {
  const remotionRoot = path.join(
    process.cwd(),
    "./server/remotion_templates/TemplateHolder"
  );

  const dataDir = path.join(remotionRoot, "data");
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

  const output = {
    quote,
    author,
    backgroundImage,
    fontFamily,
    fontSize,
    fontColor,
  };
  fs.writeFileSync(
    path.join(dataDir, "quotedata.json"),
    JSON.stringify(output, null, 2)
  );
  console.log("✅ quotedata.json updated with duration & word timestamps");
}
//facts card template
export function updateJson_Facts(
  intro: string,
  outro: string,
  facts: any,
  backgroundImage: string,
  fontSizeTitle: string,
  fontSizeSubtitle: string,
  fontFamilyTitle: string,
  fontColorTitle: string,
  fontColorSubtitle: string,
  fontFamilySubtitle: string,
  duration: number
) {
  const remotionRoot = path.join(
    process.cwd(),
    "./server/remotion_templates/TemplateHolder"
  );

  const dataDir = path.join(remotionRoot, "data");
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

  const output = {
    intro,
    outro,
    facts,
    backgroundImage,
    fontSizeTitle,
    fontSizeSubtitle,
    fontFamilyTitle,
    fontColorTitle,
    fontColorSubtitle,
    fontFamilySubtitle,
    duration,
  };
  fs.writeFileSync(
    path.join(dataDir, "factscardsconfig.json"),
    JSON.stringify(output, null, 2)
  );
  console.log("✅ factsjsonfile updated with duration & word timestamps");
}
//splitScreen template
export function updateJson_SplitScreen(
  bottomHeightPercent: number,
  bottomOpacity:number,
  bottomVideoUrl:string,
  bottomVolume: number,
  swap: boolean,
  topHeightPercent:number,
  topOpacity: number,
  topVideoUrl: string,
  topVolume:number,
  duration: number
) {
  const remotionRoot = path.join(
    process.cwd(),
    "./server/remotion_templates/TemplateHolder"
  );

  const dataDir = path.join(remotionRoot, "data");
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

  const output = {
    bottomHeightPercent,
    bottomOpacity,
    bottomVideoUrl,
    bottomVolume,
    swap,
    topHeightPercent,
    topOpacity,
    topVideoUrl,
    topVolume,
    duration,
  };
  fs.writeFileSync(
    path.join(dataDir, "splitscreenconfig.json"),
    JSON.stringify(output, null, 2)
  );
  console.log(
    "✅ splitscreenconfig.json file updated with duration & word timestamps"
  );
}

//bargraph
export function updateJson_Bargraph(
  data: any,
  title: string,
  titleFontColor: string,
  backgroundImage: string,
  accent: string,
  subtitle: string,
  currency:number,
  titleFontSize: number,
  subtitleFontSize:number,
  subtitleColor: string,
  barHeight: number,
  barGap: number,
  barLabelFontSize: number,
  barValueFontSize: number,
  fontFamily: string,
  duration:number
) {
  const remotionRoot = path.join(
    process.cwd(),
    "./server/remotion_templates/TemplateHolder"
  );

  const dataDir = path.join(remotionRoot, "data");
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

  const output = {
    data,
    title,
    titleFontColor,
    backgroundImage,
    accent,
    subtitle,
    currency,
    titleFontSize,
    subtitleFontSize,
    subtitleColor,
    barHeight,
    barGap,
    barLabelFontSize,
    barValueFontSize,
    fontFamily,
    duration
  };

  console.log(duration);
  fs.writeFileSync(
    path.join(dataDir, "bargraphconfig.json"),
    JSON.stringify(output, null, 2)
  );
  console.log("✅ bargraphconfig.json updated");
}
//texttyping
export function updateJsonfile_Texttyping(
  content: any,
  backgroundImage: any,
  fontFamily: any,
  fontSize: any,
  fontColor: any,
  duration: any,
  sound: any
) {
  const newsoundurl = soundurlReplacer(sound);
  const newfontSize = fontSize;
  const remotionRoot = path.join(
    process.cwd(),
    "./server/remotion_templates/TemplateHolder"
  );

  const dataDir = path.join(remotionRoot, "data");
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

  const output = {
    content,
    backgroundImage,
    fontFamily,
    fontSize: newfontSize,
    fontColor,
    duration,
    sound: newsoundurl,
  };
  fs.writeFileSync(
    path.join(dataDir, "data.json"),
    JSON.stringify(output, null, 2)
  );
  console.log("✅ data.json updated with duration & word timestamps");
}

export function updateJsonfile_NewTexttyping(
  phrase:any,
  backgroundIndex: number,
  fontIndex: number,
  audioIndex:number
) {
  
  const remotionRoot = path.join(
    process.cwd(),
    "./server/remotion_templates/TemplateHolder"
  );

  const dataDir = path.join(remotionRoot, "data");
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

  const output = {
    phrase,
    backgroundIndex,
    fontIndex,
    audioIndex,
  };
  fs.writeFileSync(
    path.join(dataDir, "newtexttypingconfig.json"),
    JSON.stringify(output, null, 2)
  );
  console.log("✅ newtexttypingconfig.json updated with duration & word timestamps");
}
//KpiFlipCards
export function updateJson_KpiFlipCards(
  backgroundImage: any,
  title: any,
  titleFontSize: any,
  titleFontColor: any,
  titleFontFamily: any,
  subtitle: any,
  subtitleFontSize: any,
  subtitleFontColor: any,
  subtitleFontFamily: any,
  cardsData: any,
  cardWidth: any,
  cardHeight: any,
  cardBorderRadius: any,
  cardBorderColor: any,
  cardLabelColor: any,
  cardLabelFontSize: any,
  cardContentFontFamily: any,
  cardGrid: any,
  delayStart: any,
  delayStep: any,
  cardColorBack: any,
  cardColorFront: any,
  valueFontSize: any
) {
  const remotionRoot = path.join(
    process.cwd(),
    "./server/remotion_templates/TemplateHolder"
  );

  const dataDir = path.join(remotionRoot, "data");
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

  const output = {
    backgroundImage,
    title,
    titleFontSize,
    titleFontColor,
    titleFontFamily,
    subtitle,
    subtitleFontSize,
    subtitleFontColor,
    subtitleFontFamily,
    cardsData,
    cardWidth,
    cardHeight,
    cardBorderRadius,
    cardBorderColor,
    cardLabelColor,
    cardLabelFontSize,
    cardContentFontFamily,
    cardGrid,
    delayStart,
    delayStep,
    cardColorBack,
    cardColorFront,
    valueFontSize,
  };
  fs.writeFileSync(
    path.join(dataDir, "flipcardsdata.json"),
    JSON.stringify(output, null, 2)
  );
  console.log(
    "✅ flipcardsdata.json file updated with duration & word timestamps"
  );
}
//Kenburns
export function updateJson_KenBurnsSwipe(
  images: any,
  cardHeightRatio: any,
  cardWidthRatio: any,
  duration: any
) {
  const remotionRoot = path.join(
    process.cwd(),
    "./server/remotion_templates/TemplateHolder"
  );

  const dataDir = path.join(remotionRoot, "data");
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

  const output = {
    images,
    cardWidthRatio,
    cardHeightRatio,
    duration
  };
  fs.writeFileSync(
    path.join(dataDir, "kenburnsconfig.json"),
    JSON.stringify(output, null, 2)
  );
  console.log(
    "✅ kenburnsconfig.json file updated with duration & word timestamps"
  );
}

export function updatechatsJsonfile(data: any) {
  const remotionRoot = path.join(
    process.cwd(),
    "./server/remotion_templates/TemplateHolder"
  );

  console.log(data);

  const dataDir = path.join(remotionRoot, "public");
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

  fs.writeFileSync(
    path.join(dataDir, "chats.json"),
    JSON.stringify(data, null, 2)
  );
  console.log("✅ chats.json file updated with duration & word timestamps");
}

export function updateJson_FakeTextVideo(
  chatPath: any,
  bgVideo: any,
  chatAudio: any,
  musicAudio: any,
  musicBase: any,
  musicWhileTalking: any,
  duckAttackMs: any,
  duckReleaseMs: any,
  timeShiftSec: any,
  fontFamily: any,
  fontSize: any,
  fontColor: any,
  chatTheme: any,
  avatars: any
) {
  const remotionRoot = path.join(
    process.cwd(),
    "./server/remotion_templates/TemplateHolder"
  );

  const dataDir = path.join(remotionRoot, "data");
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

  const output = {
    chatPath,
    bgVideo,
    chatAudio,
    musicAudio,
    musicBase,
    musicWhileTalking,
    duckAttackMs,
    duckReleaseMs,
    timeShiftSec,
    fontFamily,
    fontSize,
    fontColor,
    chatTheme,
    avatars,
  };
  fs.writeFileSync(
    path.join(dataDir, "faketextconversationconfig.json"),
    JSON.stringify(output, null, 2)
  );
  console.log(
    "✅ faketextconversationconfig.json file updated with duration & word timestamps"
  );
}

//reddit video
//assets initialization
export function updateRedditScriptJson(script: any) {
  const remotionRoot = path.join(
    process.cwd(),
    "./server/remotion_templates/TemplateHolder"
  );

  const dataDir = path.join(remotionRoot, "data/others");
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  fs.writeFileSync(
    path.join(dataDir, "redditstoryscript.json"),
    JSON.stringify(script, null, 2)
  );
  console.log(
    "✅ redditstoryscript.json file updated with duration & word timestamps"
  );
}

export function updateJsonConfig_reddit(
  voiceoverPath: any,
  duration: any,
  fontSize: any,
  fontFamily: any,
  fontColor: any,
  sentenceBgColor: any,
  backgroundVideo: any,
  backgroundMusicPath: any
) {
  const remotionRoot = path.join(
    process.cwd(),
    "./server/remotion_templates/TemplateHolder"
  );

  const dataDir = path.join(remotionRoot, "data");
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

  const output = {
    voiceoverPath,
    duration,
    fontSize,
    fontFamily,
    fontColor,
    sentenceBgColor,
    backgroundVideo,
    backgroundMusicPath,
  };
  fs.writeFileSync(
    path.join(dataDir, "redditconfig.json"),
    JSON.stringify(output, null, 2)
  );
  console.log(
    "✅ redditconfig.json file updated with duration & word timestamps"
  );
}

//storytelling
//assets
export function updateStoryTellingScriptJson(script: any) {
  const remotionRoot = path.join(
    process.cwd(),
    "./server/remotion_templates/TemplateHolder"
  );

  const dataDir = path.join(remotionRoot, "data/others");
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  fs.writeFileSync(
    path.join(dataDir, "storytellingscript.json"),
    JSON.stringify(script, null, 2)
  );
  console.log(
    "✅ storytellingscript.json file updated with duration & word timestamps"
  );
}

export function updateJsonConfig_Story(
  voiceoverPath: any,
  duration: any,
  fontSize: any,
  fontFamily: any,
  fontColor: any,
  sentenceBgColor: any,
  backgroundVideo: any,
  backgroundMusicPath: any
) {
  const remotionRoot = path.join(
    process.cwd(),
    "./server/remotion_templates/TemplateHolder"
  );

  const dataDir = path.join(remotionRoot, "data");
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

  const output = {
    voiceoverPath,
    duration,
    fontSize,
    fontFamily,
    fontColor,
    sentenceBgColor,
    backgroundVideo,
    backgroundMusicPath,
  };
  fs.writeFileSync(
    path.join(dataDir, "storytellingconfig.json"),
    JSON.stringify(output, null, 2)
  );
  console.log(
    "✅ storytellingconfig.json file updated with duration & word timestamps"
  );
}

export function updateJsonConfig_CurveLineTrend(
  data: any
) {
  const remotionRoot = path.join(
    process.cwd(),
    "./server/remotion_templates/TemplateHolder"
  );

  const dataDir = path.join(remotionRoot, "data");
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

  fs.writeFileSync(
    path.join(dataDir, "curvelinetrendconfig.json"),
    JSON.stringify(data, null, 2)
  );
  console.log(
    "✅ curvelinetrendconfig.json file updated with duration & word timestamps"
  );
}
