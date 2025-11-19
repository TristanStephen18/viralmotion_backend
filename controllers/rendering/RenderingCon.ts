import path from "path";
import os from "os";
import fs from "fs";
import { renderMedia, selectComposition } from "@remotion/renderer";
import { bundle } from "@remotion/bundler";
import type { Request, Response } from "express";
import cloudinary from "../../utils/cloudinaryClient.ts";
import { convertVideo } from "../../utils/ffmpeg.ts";
import { entry } from "../entrypoint.ts";

export const handleExport = async (req: Request, res: Response) => {
  const { inputProps, format, compositionId } = req.body;

  console.log("Receive Props: ", inputProps);

  try {
    if (!fs.existsSync(entry)) {
      return res.status(404).json({ error: "Remotion entry file not found" });
    }
    const bundleLocation = await bundle({
      entryPoint: path.resolve(entry),
      webpackOverride: (config) => config,
    });

    const composition = await selectComposition({
      serveUrl: bundleLocation,
      id: compositionId,
      inputProps,
    });

    const tmpBaseName = `${compositionId}-${Date.now()}`;
    const tmpDir = os.tmpdir();
    const mp4Path = path.join(tmpDir, `${tmpBaseName}.mp4`);

    console.log("🎬 Rendering video to:", mp4Path);

    // 🧠 4. Render MP4 using Remotion
    await renderMedia({
      serveUrl: bundleLocation,
      composition,
      codec: "h264",
      outputLocation: mp4Path,
      inputProps,
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
  } catch (error: any) {
    res.status(404).json({ message: "Error rendering video" });
  }
};
