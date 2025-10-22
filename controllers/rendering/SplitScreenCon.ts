import path from "path";
import { convertVideo } from "../../utils/ffmpeg.ts";
import { getCompositions, renderMedia } from "@remotion/renderer";
import type { Request, Response } from "express";

import fs from "fs";
import { bundle } from "@remotion/bundler";
import { updateJson_SplitScreen } from "../functions/jsonupdater.ts";
import {
  splitScreenVideoSelectedUrlReplacer,
  splitScreenVideoUploadedUrlReplacer,
} from "../functions/soundandfontsize.ts";
import { entry } from "../entrypoint.ts";
import cloudinary from "../../utils/cloudinaryClient.ts";
import os from "os";

export const handleExport = async (req: Request, res: Response) => {
  const {
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
    format,
  } = req.body;

  console.log(req.body);

  // console.log(topVideoUrl, newTopUrl);

  updateJson_SplitScreen(
    bottomHeightPercent,
    bottomOpacity,
    bottomVideoUrl.replace("localhost", "127.0.0.1"),
    bottomVolume,
    swap,
    topHeightPercent,
    topOpacity,
    topVideoUrl.replace("localhost", "127.0.0.1"),
    topVolume,
    duration
  );

  try {
    if (!fs.existsSync(entry)) {
      return res.status(404).json({ error: "Remotion entry file not found" });
    }

    const bundleLocation = await bundle(entry);
    const comps = await getCompositions(bundleLocation);
    const comp = comps.find((c) => c.id === "SplitScreen");
    if (!comp) {
      return res.status(404).json({ error: "Composition not found" });
    }
    // 🗂️ 3. Temporary file paths
    const tmpBaseName = `splitscreen-${Date.now()}`;
    const tmpDir = os.tmpdir();
    const mp4Path = path.join(tmpDir, `${tmpBaseName}.mp4`);

    console.log("🎬 Rendering video to:", mp4Path);

    // 🧠 4. Render MP4 using Remotion
    await renderMedia({
      serveUrl: bundleLocation,
      composition: comp,
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
    });
  } catch (err: any) {
    console.error("❌ Error rendering Remotion project:", err);
    return res.status(500).json({
      error: "Render failed",
      message: err instanceof Error ? err.message : "Unknown error",
      stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    });
  }
};
