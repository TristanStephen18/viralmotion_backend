import path from "path";
import os from "os";
import fs from "fs";
import { getCompositions, renderMedia } from "@remotion/renderer";
import { bundle } from "@remotion/bundler";
import { updateJson_Bargraph } from "../functions/jsonupdater.ts";
import type { Request, Response } from "express";
import cloudinary from "../../utils/cloudinaryClient.ts";
import { convertVideo } from "../../utils/ffmpeg.ts";

export const handleExport = async (req: Request, res: Response) => {
  const {
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
    duration,
    format,
  } = req.body;

  try {
    // 🧩 1. Update Remotion input JSON
    updateJson_Bargraph(
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
    );

    // 🎞 2. Bundle the Remotion project
    const entry = path.join(
      process.cwd(),
      "./server/remotion_templates/TemplateHolder/src/index.ts"
    );
    const bundleLocation = await bundle(entry);
    const compositions = await getCompositions(bundleLocation);
    const composition = compositions.find((c) => c.id === "BarGraph");

    if (!composition) {
      return res.status(404).json({ error: "Composition not found" });
    }

    // 🗂️ 3. Temporary file paths
    const tmpBaseName = `bargraph-${Date.now()}`;
    const tmpDir = os.tmpdir();
    const mp4Path = path.join(tmpDir, `${tmpBaseName}.mp4`);

    console.log("🎬 Rendering video to:", mp4Path);

    // 🧠 4. Render MP4 using Remotion
    await renderMedia({
      serveUrl: bundleLocation,
      composition,
      codec: "h264",
      outputLocation: mp4Path,
    });

    console.log("✅ Render complete.");

    // 🌀 5. Convert using FFmpeg if needed
    let finalPath = mp4Path;
    let finalFormat = "mp4";

    if (format === "gif" || format === "webm") {
      console.log(`🎞 Converting to ${format}...`);
      finalPath = await convertVideo(mp4Path, format);
      finalFormat = format;
      console.log(`✅ Converted to ${format}:`, finalPath);
    }

    // ☁️ 6. Upload to Cloudinary
    console.log("☁️ Uploading to Cloudinary...");

    const resourceType = finalFormat === "gif" ? "image" : "video";

    const uploadResult = await new Promise<any>((resolve, reject) => {
      cloudinary.uploader.upload(
        finalPath,
        {
          resource_type: resourceType,
          folder: "remotion_renders",
          public_id: tmpBaseName,
          format: finalFormat,
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
    });

    setTimeout(() => {
      [mp4Path, finalPath].forEach((file) => {
        fs.unlink(file, (err) => {
          if (err) console.warn("⚠️ Failed to delete temp file:", err);
        });
      });
    }, 3000);

    console.log("☁️ Uploaded successfully:", uploadResult.secure_url);

    // ✅ 8. Send response
    return res.json({
      url: uploadResult.secure_url,
      format: finalFormat,
      duration,
    });
  } catch (err: any) {
    console.error("❌ Render error:", err);
    res.status(500).json({
      error: "Render failed",
      message: err.message || "Unknown error",
    });
  }
};
