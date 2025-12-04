import type { Request, Response } from "express";
import ytDlpExec from "yt-dlp-exec";
import { db } from "../../db/client.ts";
import { youtubeDownloads } from "../../db/schema.ts";
import { eq, desc } from "drizzle-orm";
import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const getVideoInfo = async (req: Request, res: Response) => {
  try {
    const { url } = req.body;

    if (!url || !url.trim()) {
      return res.status(400).json({
        success: false,
        error: "YouTube URL is required",
      });
    }

    console.log("[YouTube] Fetching video info for:", url);

    // Get video info using yt-dlp
    const info = await ytDlpExec(url, {
      dumpSingleJson: true,
      noCheckCertificate: true,
      noWarnings: true,
      preferFreeFormats: true,
    });

    // Format duration (seconds to readable format)
    const formatDuration = (seconds: number): string => {
      if (seconds < 60) return `${seconds}s`;
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      if (minutes < 60) return `${minutes}m ${remainingSeconds}s`;
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return `${hours}h ${remainingMinutes}m`;
    };

    // Format numbers (e.g., 1234567 -> "1.2M")
    const formatNumber = (num: number): string => {
      if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
      if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
      return num.toString();
    };

    // Extract available formats
    const formats =
      info.formats
        ?.filter(
          (format: any) =>
            format.ext === "mp4" && format.vcodec !== "none" && format.height
        )
        .map((format: any) => ({
          quality: `${format.height}p`,
          filesize: format.filesize || 0,
          type:
            format.height >= 720
              ? format.height >= 1080
                ? "Full HD"
                : "HD"
              : "SD",
        }))
        .filter(
          (format: any, index: number, self: any[]) =>
            index === self.findIndex((f) => f.quality === format.quality)
        )
        .sort((a: any, b: any) => parseInt(b.quality) - parseInt(a.quality)) ||
      [];

    // Ensure we have at least the standard qualities
    const standardQualities = ["1080p", "720p", "480p"];
    const availableQualities = formats.map((f: any) => f.quality);

    standardQualities.forEach((quality) => {
      if (!availableQualities.includes(quality)) {
        formats.push({
          quality,
          filesize: 0,
          type:
            quality === "1080p" ? "Full HD" : quality === "720p" ? "HD" : "SD",
        });
      }
    });

    formats.sort((a: any, b: any) => parseInt(b.quality) - parseInt(a.quality));

    const videoInfo = {
      id: info.id,
      title: info.title || "Unknown Title",
      thumbnail: info.thumbnail || "",
      duration: formatDuration(info.duration || 0),
      views: `${formatNumber(info.view_count || 0)} views`,
      likes: `${formatNumber(info.like_count || 0)} likes`,
      formats: formats.slice(0, 3),
    };

    console.log("[YouTube] Video info fetched successfully:", videoInfo.title);

    res.json({ success: true, video: videoInfo });
  } catch (error) {
    console.error("[YouTube] Get video info error:", error);
    res.status(500).json({
      success: false,
      error:
        "Failed to fetch video information. Please check the URL and try again.",
    });
  }
};

export const downloadVideo = async (req: Request, res: Response) => {
  try {
    // Log everything received
    console.log("=== BACKEND DOWNLOAD DEBUG ===");
    console.log("1. Request body:", JSON.stringify(req.body, null, 2));
    console.log("2. URL:", req.body.url);
    console.log("3. Quality:", req.body.quality);
    console.log("4. User object:", (req as any).user);
    console.log("==============================");

    const authUser = (req as any).user;
    const userId = authUser?.id ?? authUser?.userId;

    console.log("5. Extracted userId:", userId);

    if (!userId) {
      console.log("❌ REJECTED: No userId");
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    const { url, quality } = req.body;

    if (!url || !url.trim()) {
      console.log("❌ REJECTED: URL missing or empty");
      return res.status(400).json({
        success: false,
        error: "YouTube URL is required",
      });
    }

    if (!quality) {
      console.log("❌ REJECTED: Quality missing");
      return res.status(400).json({
        success: false,
        error: "Quality is required",
      });
    }

    console.log(`✅ VALIDATION PASSED: ${url} at ${quality}`);

    // Get basic video info first
    const info = await ytDlpExec(url, {
      dumpSingleJson: true,
      noCheckCertificate: true,
      noWarnings: true,
    });

    // Create database record
    const [download] = await db
      .insert(youtubeDownloads)
      .values({
        userId,
        videoId: info.id,
        videoUrl: url,
        title: info.title || "Unknown Title",
        thumbnail: info.thumbnail || null,
        duration: info.duration ? `${info.duration}s` : null,
        views: info.view_count ? `${info.view_count}` : null,
        likes: info.like_count ? `${info.like_count}` : null,
        quality,
        filesize: null,
        status: "pending",
      })
      .returning();

    console.log(`[YouTube] Created download record: ${download.id}`);

    res.status(202).json({
      success: true,
      download: {
        id: download.id,
        status: "pending",
        message: "Download started",
      },
    });

    processVideoDownload(download.id, url, quality, info).catch((error) => {
      console.error(
        `[YouTube] Async processing error for ${download.id}:`,
        error
      );
    });
  } catch (error) {
    console.error("[YouTube] Download error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to start download",
    });
  }
};

async function processVideoDownload(
  downloadId: string,
  url: string,
  quality: string,
  videoInfo: any
) {
  try {
    console.log(`[YouTube] Processing download: ${downloadId}`);

    await db
      .update(youtubeDownloads)
      .set({ status: "processing" })
      .where(eq(youtubeDownloads.id, downloadId));

    const outputsDir = path.join(__dirname, "../../outputs");
    if (!fs.existsSync(outputsDir)) {
      fs.mkdirSync(outputsDir, { recursive: true });
    }

    const tempVideoPath = path.join(outputsDir, `${downloadId}.mp4`);

    console.log(`[YouTube] Downloading video to: ${tempVideoPath}`);

    const qualityHeight = parseInt(quality);
    
    // ✅ FORCE H.264 VIDEO + AAC AUDIO for maximum compatibility
    // This ensures the video works on Windows Media Player, phones, browsers, etc.
    const formatString = `bestvideo[height<=${qualityHeight}][vcodec^=avc1]+bestaudio[acodec=mp4a]/bestvideo[height<=${qualityHeight}][vcodec^=avc]+bestaudio[acodec=mp4a]/bestvideo[height<=${qualityHeight}]+bestaudio[acodec=mp4a]/bestvideo[height<=${qualityHeight}]+bestaudio/best[height<=${qualityHeight}]/best`;

    console.log(`[YouTube] Format: H.264 video + AAC audio for compatibility`);
    
    await ytDlpExec(url, {
      output: tempVideoPath,
      format: formatString,
      mergeOutputFormat: "mp4",
      // ✅ CRITICAL: Convert audio to AAC if needed
      postprocessorArgs: "ffmpeg:-c:v copy -c:a aac -b:a 192k",
      noCheckCertificate: true,
      noWarnings: true,
      noPart: true,
    });

    console.log(`[YouTube] Download command completed`);

    let actualFilePath = tempVideoPath;
    
    if (!fs.existsSync(tempVideoPath)) {
      console.log(`[YouTube] File not at expected path, searching...`);
      const files = fs.readdirSync(outputsDir);
      const matchingFile = files.find(f => f.startsWith(downloadId) && f.endsWith('.mp4'));
      
      if (!matchingFile) {
        const anyFile = files.find(f => f.startsWith(downloadId));
        if (anyFile) {
          console.log(`[YouTube] ⚠️ Found file: ${anyFile}`);
          throw new Error(`Downloaded file format issue: ${anyFile}`);
        }
        throw new Error("Downloaded MP4 file not found");
      }
      
      actualFilePath = path.join(outputsDir, matchingFile);
      console.log(`[YouTube] Found file at: ${actualFilePath}`);
    }

    console.log(`[YouTube] Video downloaded successfully with AAC audio`);

    const stats = fs.statSync(actualFilePath);
    const filesize = stats.size;

    console.log(`[YouTube] File size: ${(filesize / 1024 / 1024).toFixed(2)} MB`);

    console.log(`[YouTube] Uploading to Cloudinary...`);
    const cloudinaryResult = await cloudinary.uploader.upload(actualFilePath, {
      resource_type: "video",
      folder: "youtube_downloads",
      public_id: downloadId,
    });

    console.log(`[YouTube] Uploaded to Cloudinary: ${cloudinaryResult.secure_url}`);

    if (fs.existsSync(actualFilePath)) {
      fs.unlinkSync(actualFilePath);
      console.log(`[YouTube] Temp file deleted`);
    }

    await db
      .update(youtubeDownloads)
      .set({
        status: "completed",
        downloadedVideoUrl: cloudinaryResult.secure_url,
        filesize,
        completedAt: new Date(),
        metadata: {
          duration: cloudinaryResult.duration,
          format: cloudinaryResult.format,
          size: cloudinaryResult.bytes,
          width: cloudinaryResult.width,
          height: cloudinaryResult.height,
        },
      })
      .where(eq(youtubeDownloads.id, downloadId));

    console.log(`[YouTube] ✅ Download completed: ${downloadId}`);
  } catch (error) {
    console.error(`[YouTube] ❌ Processing error:`, error);

    await db
      .update(youtubeDownloads)
      .set({
        status: "failed",
        errorMessage: error instanceof Error ? error.message : "Unknown error",
      })
      .where(eq(youtubeDownloads.id, downloadId));
  }
}

export const getDownloads = async (req: Request, res: Response) => {
  try {
    const authUser = (req as any).user;
    const userId = authUser?.id ?? authUser?.userId;

    if (!userId) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;

    const downloads = await db
      .select()
      .from(youtubeDownloads)
      .where(eq(youtubeDownloads.userId, userId))
      .orderBy(desc(youtubeDownloads.createdAt))
      .limit(limit)
      .offset(offset);

    res.json({ success: true, downloads });
  } catch (error) {
    console.error("[YouTube] Get downloads error:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to fetch downloads" });
  }
};

export const getDownloadById = async (req: Request, res: Response) => {
  try {
    const authUser = (req as any).user;
    const userId = authUser?.id ?? authUser?.userId;

    if (!userId) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    const { id } = req.params;

    const [download] = await db
      .select()
      .from(youtubeDownloads)
      .where(eq(youtubeDownloads.id, id));

    if (!download) {
      return res
        .status(404)
        .json({ success: false, error: "Download not found" });
    }

    if (download.userId !== userId) {
      return res.status(403).json({ success: false, error: "Forbidden" });
    }

    res.json({ success: true, download });
  } catch (error) {
    console.error("[YouTube] Get download error:", error);
    res.status(500).json({ success: false, error: "Failed to fetch download" });
  }
};

export const deleteDownload = async (req: Request, res: Response) => {
  try {
    const authUser = (req as any).user;
    const userId = authUser?.id ?? authUser?.userId;

    if (!userId) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    const { id } = req.params;

    const [download] = await db
      .select()
      .from(youtubeDownloads)
      .where(eq(youtubeDownloads.id, id));

    if (!download) {
      return res
        .status(404)
        .json({ success: false, error: "Download not found" });
    }

    if (download.userId !== userId) {
      return res.status(403).json({ success: false, error: "Forbidden" });
    }

    if (download.downloadedVideoUrl) {
      try {
        await cloudinary.uploader.destroy(id, { resource_type: "video" });
        console.log(`[YouTube] Deleted from Cloudinary: ${id}`);
      } catch (cloudError) {
        console.error("[YouTube] Cloudinary deletion error:", cloudError);
      }
    }

    await db.delete(youtubeDownloads).where(eq(youtubeDownloads.id, id));

    res.json({ success: true, message: "Download deleted successfully" });
  } catch (error) {
    console.error("[YouTube] Delete download error:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to delete download" });
  }
};
