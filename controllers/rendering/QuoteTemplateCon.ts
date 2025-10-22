import { bundle } from "@remotion/bundler";
import { getCompositions, renderMedia } from "@remotion/renderer";
import path from "path";
import { updateJsonfile_QuoteData } from "../functions/jsonupdater.ts";
import fs from "fs";
import { convertVideo } from "../../utils/ffmpeg.ts";
import type { Request, Response } from "express";
import { entry } from "../entrypoint.ts";
import cloudinary from "../../utils/cloudinaryClient.ts";
// import { Result } from "postcss";
import os from "os";

export const videoGeneration = async (req: Request, res: Response) => {
  const { quote, author, imageurl, fontsize, fontcolor, fontfamily } = req.body;

  console.log(req.body);

  console.log("📝 Received props:", {
    quote,
    author,
    imageurl,
    fontsize,
    fontcolor,
    fontfamily,
  });

  updateJsonfile_QuoteData(
    quote,
    author,
    imageurl,
    fontfamily,
    fontsize,
    fontcolor
  );

  try {
    const entry = path.join(
      process.cwd(),
      "./server/remotion_templates/TemplateHolder/src/index.ts"
    );
    console.log("📂 Bundling Remotion project from:", entry);

    // Check if entry file exists
    if (!fs.existsSync(entry)) {
      console.error("❌ Entry file not found:", entry);
      return res.status(404).json({ error: "Remotion entry file not found" });
    }

    const bundleLocation = await bundle(entry);
    console.log("📦 Bundle location:", bundleLocation);

    const comps = await getCompositions(bundleLocation);
    console.log(
      "📑 Found compositions:",
      comps.map((c) => c.id)
    );

    const comp = comps.find((c) => c.id === "QuoteComposition");
    if (!comp) {
      console.error("❌ Composition 'QuoteComposition' not found!");
      console.error(
        "Available compositions:",
        comps.map((c) => c.id)
      );
      return res.status(404).json({ error: "Composition not found" });
    }
    const outputDir = path.join(process.cwd(), "server/outputs");
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const outputFile = `quote-${Date.now()}.mp4`;
    const outputLocation = path.join(outputDir, outputFile);
    console.log("📹 Output location:", outputLocation);

    await renderMedia({
      serveUrl: bundleLocation,
      composition: comp,
      codec: "h264",
      outputLocation,
    });

    console.log("✅ Render complete!");

    const videoUrl = `http://localhost:3000/videos/${outputFile}`;

    return res.json({
      url: videoUrl,
      filename: outputFile,
    });
  } catch (err: any) {
    console.error("❌ Error rendering Remotion project:", err);

    // Provide more specific error information
    let errorMessage = "Unknown error occurred";
    if (err instanceof Error) {
      errorMessage = err.message;
    }

    return res.status(500).json({
      error: "Render failed",
      message: errorMessage,
      stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    });
  }
};

export const handleExport = async (req: Request, res: Response) => {
  const { quote, author, imageurl, fontsize, fontcolor, fontfamily, format } =
    req.body;

  console.log("📝 Received props:", {
    quote,
    author,
    imageurl,
    fontsize,
    fontcolor,
    fontfamily,
    format,
  });

  updateJsonfile_QuoteData(
    quote,
    author,
    imageurl,
    fontfamily,
    fontsize,
    fontcolor
  );

  try {
    if (!fs.existsSync(entry)) {
      return res.status(404).json({ error: "Remotion entry file not found" });
    }

    const bundleLocation = await bundle(entry);
    const comps = await getCompositions(bundleLocation);
    const comp = comps.find((c) => c.id === "QuoteComposition");
    if (!comp) {
      return res.status(404).json({ error: "Composition not found" });
    }

    // 🗂️ 3. Temporary file paths
    const tmpBaseName = `quotespotlight-${Date.now()}`;
    const tmpDir = os.tmpdir();
    const mp4Path = path.join(tmpDir, `${tmpBaseName}.mp4`);

    console.log("🎬 Rendering video to:", mp4Path);

    // 🧠 4. Render MP4 using Remotion
    await renderMedia({
      timeoutInMilliseconds: 300000,
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
