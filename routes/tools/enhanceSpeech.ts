import { Router, type Request, type Response } from "express";

import multer from "multer";
import { enhanceAudio } from "../../utils/audioEnhancer.ts";

const router = Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB
  },
  fileFilter: (req, file, cb) => {
    // Accept audio files only
    const allowedMimes = [
      "audio/mpeg",
      "audio/mp3",
      "audio/wav",
      "audio/wave",
      "audio/x-wav",
      "audio/mp4",
      "audio/m4a",
      "audio/ogg",
      "audio/webm",
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only audio files are allowed."));
    }
  },
});

/**
 * POST /api/enhance-speech
 * Enhance audio file with AI
 */
router.post(
  "/",
  upload.single("audio"),
  async (req: Request, res: Response) => {
    try {
      // Validate request
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: "No audio file provided",
        });
      }

      // Validate file buffer
      if (!req.file.buffer || req.file.buffer.length === 0) {
        return res.status(400).json({
          success: false,
          error: "File appears to be empty or corrupted",
        });
      }

      // Get parameters
      const denoiseLevel = parseInt(req.body.denoiseLevel) || 7;
      const enhanceClarity = req.body.enhanceClarity === "true";
      const removeEcho = req.body.removeEcho === "true";

      console.log("📥 Received enhancement request:", {
        filename: req.file.originalname,
        size: `${(req.file.size / 1024 / 1024).toFixed(2)} MB`,
        mimetype: req.file.mimetype,
        denoiseLevel,
        enhanceClarity,
        removeEcho,
      });

      // Enhance audio with AssemblyAI
      const result = await enhanceAudio(req.file.buffer);

      console.log("✅ Enhancement completed:", {
        confidence: result.confidence
          ? `${(result.confidence * 100).toFixed(1)}%`
          : "N/A",
        transcriptLength: result.transcript?.length || 0,
      });

      // Return result
      res.json({
        success: true,
        audioUrl: result.audioUrl,
        transcript: result.transcript,
        confidence: result.confidence,
        metadata: {
          originalSize: req.file.size,
          processedAt: new Date().toISOString(),
        },
      });
    } catch (error: any) {
      console.error("❌ Enhancement error:", error);

      res.status(500).json({
        success: false,
        error: "Audio enhancement failed",
        details: error.message,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      });
    }
  }
);

export default router;
