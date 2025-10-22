// utils/ffmpegConvert.ts
import { spawn } from "child_process";
import * as path from "path";
import ffmpegPath from "ffmpeg-static";
import { getVideoDurationInSeconds } from "get-video-duration";

export async function convertVideo(
  input: string,
  format: "gif" | "webm"
): Promise<string> {
  return new Promise((resolve, reject) => {
    const outputDir = path.dirname(input);
    const baseName = path.basename(input, path.extname(input));
    const outputFile = `${baseName}.${format}`;
    const outputPath = path.join(outputDir, outputFile);

    const args =
      format === "gif"
        ? [
            "-i",
            input,
            "-vf",
            "fps=10,scale=480:-1:flags=lanczos",
            "-loop",
            "0",
            outputPath,
          ]
        : [
            "-i",
            input,
            "-c:v",
            "libvpx-vp9",
            "-b:v",
            "1M",
            "-c:a",
            "libopus",
            outputPath,
          ];

    const ffmpeg = spawn(String(ffmpegPath), args);

    ffmpeg.stderr.on("data", (data) => {
      console.log(`[ffmpeg]: ${data.toString()}`);
    });

    ffmpeg.on("close", (code) => {
      if (code === 0) resolve(outputPath);
      else reject(new Error(`FFmpeg exited with code ${code}`));
    });
  });
}

// ✅ async video duration extractor
export const getVideoDuration = async (filePath: string): Promise<number> => {
  try {
    const duration = await getVideoDurationInSeconds(filePath);
    return Math.round(duration); // ⏱ Round to nearest whole second
  } catch (err) {
    console.error("❌ Failed to get video duration:", err);
    return 0;
  }
};

