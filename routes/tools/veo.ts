import express from "express";
import type { Request, Response } from "express";
import { GoogleGenAI } from "@google/genai";
import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { randomUUID } from "crypto";

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


// Initialize Google Gemini AI
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Only Veo 3.1 models are supported by generateVideos right now.
const SUPPORTED_MODELS = new Set([
  "veo-3.1-generate-preview",
  "veo-3.1-fast-generate-preview",
]);

// In-memory storage for generation status
interface GenerationStatus {
  id: string;
  status: "pending" | "processing" | "completed" | "failed";
  prompt: string;
  model: string;
  duration: number;
  aspectRatio: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  errorMessage?: string;
  createdAt: Date;
  completedAt?: Date;
}

const generationsStore = new Map<string, GenerationStatus>();

// Clean up old generations after 24 hours
setInterval(() => {
  const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
  for (const [id, gen] of generationsStore.entries()) {
    if (gen.createdAt.getTime() < oneDayAgo) {
      generationsStore.delete(id);
      console.log(`🧹 Cleaned up old generation: ${id}`);
    }
  }
}, 60 * 60 * 1000);

// Create outputs directory if it doesn't exist
const outputsDir = path.join(__dirname, "../outputs");
if (!fs.existsSync(outputsDir)) {
  fs.mkdirSync(outputsDir, { recursive: true });
}

// Video Generation (No Auth Required)
router.post("/generate", async (req: Request, res: Response): Promise<void> => {
  console.log("\n🎬 ===== VEO3 Video Generation =====");
  const startTime = Date.now();

  try {
    const { prompt, model, duration, aspectRatio } = req.body;

    if (!prompt || prompt.trim().length === 0) {
      console.error("❌ No prompt provided");
      res.status(400).json({ success: false, error: "Prompt is required" });
      return;
    }

    console.log("📝 Request parameters:");
    console.log("   Prompt:", prompt.trim());
    console.log("   Model:", model || "default");
    console.log("   Duration (raw):", duration, typeof duration);
    console.log("   Aspect Ratio:", aspectRatio || "default");

    // Validate configuration
    if (!process.env.GEMINI_API_KEY) {
      console.error("❌ Google AI Studio API key not configured");
      res.status(500).json({
        success: false,
        error: "Service configuration error",
        details: "Google AI Studio not configured",
      });
      return;
    }

    if (
      !process.env.CLOUDINARY_CLOUD_NAME ||
      !process.env.CLOUDINARY_API_KEY ||
      !process.env.CLOUDINARY_API_SECRET
    ) {
      console.error("❌ Cloudinary not configured");
      res.status(500).json({
        success: false,
        error: "Service configuration error",
        details: "Cloudinary not configured",
      });
      return;
    }

    console.log("✅ Configuration validated");

    const requestedModel = typeof model === "string" ? model : "";
    const modelId = SUPPORTED_MODELS.has(requestedModel)
      ? requestedModel
      : "veo-3.1-generate-preview";

    // Force integer using parseInt and bitwise OR
    const parsedDuration = parseInt(String(duration), 10);
    const durationSeconds = Number.isNaN(parsedDuration) 
      ? 8 
      : Math.min(Math.max(parsedDuration, 4), 8) | 0; // Bitwise OR forces integer

    const ratio = aspectRatio || "16:9";
    const generationId = randomUUID();

    console.log("\n📋 Final parameters:");
    console.log("   Generation ID:", generationId);
    console.log("   Model:", modelId);
    console.log("   Duration:", durationSeconds, typeof durationSeconds);
    console.log("   Aspect Ratio:", ratio);

    generationsStore.set(generationId, {
      id: generationId,
      status: "pending",
      prompt: prompt.trim(),
      model: modelId,
      duration: durationSeconds,
      aspectRatio: ratio,
      createdAt: new Date(),
    });

    console.log("✅ Generation record created");

    const initTime = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`\n✅ ===== Request Accepted (${initTime}s) =====\n`);

    res.status(202).json({
      success: true,
      generation: {
        id: generationId,
        status: "pending",
        message: "Video generation started",
      },
    });

    processVideoGeneration(generationId, prompt.trim(), modelId, durationSeconds, ratio).catch(
      (error) => {
        console.error(`\n❌ Async processing error for ${generationId}:`, error.message);
      }
    );
  } catch (error: any) {
    console.error("\n❌ ===== ERROR =====");
    console.error("Type:", error.constructor ? error.constructor.name : "Unknown");
    console.error("Message:", error.message);
    console.error("===================\n");

    res.status(500).json({
      success: false,
      error: "Failed to start video generation",
      details: error.message,
    });
  }
});

async function processVideoGeneration(
  generationId: string,
  prompt: string,
  model: string,
  duration: number,
  aspectRatio: string
): Promise<void> {
  const startTime = Date.now();
  console.log(`\n🎥 ===== Processing Generation: ${generationId} =====`);
  console.log("   Model:", model);
  console.log("   Duration:", duration, typeof duration);
  console.log("   Aspect:", aspectRatio);
  console.log("   Prompt:", prompt.substring(0, 100) + (prompt.length > 100 ? "..." : ""));

  try {
    const generation = generationsStore.get(generationId);
    if (generation) {
      generation.status = "processing";
      console.log("📊 Status: pending → processing");
    }

    // Build the config object
    const config: {
      aspectRatio?: string;
      durationSeconds?: number;
    } = {};

    // Only add aspectRatio if it's a valid format
    if (aspectRatio && ["16:9", "9:16", "1:1"].includes(aspectRatio)) {
      config.aspectRatio = aspectRatio;
    }

    // DON'T pass durationSeconds - let the API use its default
    // The API seems to have issues with this parameter
    
    console.log("\n📤 Step 1: Calling Google Gemini VEO API...");
    console.log("   Config being sent:", JSON.stringify(config));

    let operation = await ai.models.generateVideos({
      model: model,
      prompt: prompt,
      config: Object.keys(config).length > 0 ? config : undefined,
    });

    console.log("✅ Operation started");
    console.log("   Operation ID:", operation.name);

    // Step 2: Poll for completion
    console.log("\n⏳ Step 2: Waiting for video generation...");
    let attempts = 0;
    const maxAttempts = 60;

    while (!operation.done && attempts < maxAttempts) {
      attempts++;
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(0);
      console.log(`   Polling... (${attempts}/${maxAttempts}) - Elapsed: ${elapsed}s`);

      await new Promise((resolve) => setTimeout(resolve, 10000));
      operation = await ai.operations.getVideosOperation({ operation });
    }

    if (!operation.done) {
      throw new Error("Video generation timeout");
    }

    if (!operation.response?.generatedVideos?.[0]) {
      throw new Error("No video generated");
    }

    const genTime = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`✅ Video generated (${genTime}s)`);

    const generatedVideo = operation.response.generatedVideos[0];

    // Step 3: Download video
    console.log("\n💾 Step 3: Downloading video...");
    const tempVideoPath = path.join(outputsDir, `${generationId}_temp.mp4`);

    await ai.files.download({
      file: generatedVideo.video,
      downloadPath: tempVideoPath,
    });

    const fileSize = fs.statSync(tempVideoPath).size;
    console.log("✅ Video downloaded");
    console.log("   Path:", tempVideoPath);
    console.log("   Size:", (fileSize / 1024 / 1024).toFixed(2), "MB");

    // Step 4: Upload to Cloudinary
    console.log("\n☁️  Step 4: Uploading to Cloudinary...");
    const cloudinaryResult = await cloudinary.uploader.upload(tempVideoPath, {
      resource_type: "video",
      folder: "veo3_generations",
      public_id: generationId,
    });

    console.log("✅ Uploaded to Cloudinary");
    console.log("   URL:", cloudinaryResult.secure_url);
    console.log("   Public ID:", cloudinaryResult.public_id);
    console.log("   Format:", cloudinaryResult.format);
    console.log("   Size:", (cloudinaryResult.bytes / 1024 / 1024).toFixed(2), "MB");

    // Step 5: Generate thumbnail
    console.log("\n🖼️  Step 5: Generating thumbnail...");
    const thumbnailUrl = cloudinary.url(`veo3_generations/${generationId}`, {
      resource_type: "video",
      format: "jpg",
      transformation: [{ width: 640, height: 360, crop: "fill", start_offset: "1" }],
    });

    console.log("✅ Thumbnail generated");
    console.log("   URL:", thumbnailUrl);

    // Step 6: Cleanup
    console.log("\n🧹 Step 6: Cleaning up...");
    if (fs.existsSync(tempVideoPath)) {
      fs.unlinkSync(tempVideoPath);
      console.log("✅ Temp file deleted");
    }

    const finalGeneration = generationsStore.get(generationId);
    if (finalGeneration) {
      finalGeneration.status = "completed";
      finalGeneration.videoUrl = cloudinaryResult.secure_url;
      finalGeneration.thumbnailUrl = thumbnailUrl;
      finalGeneration.completedAt = new Date();
    }

    const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log("\n✅ ===== Generation Complete =====");
    console.log(`   Total time: ${totalTime}s`);
    console.log(`   Video URL: ${cloudinaryResult.secure_url}`);
    console.log("===================================\n");
  } catch (error: any) {
    console.error("\n❌ ===== GENERATION ERROR =====");
    console.error("Generation ID:", generationId);
    console.error("Type:", error.constructor ? error.constructor.name : "Unknown");
    console.error("Message:", error.message);
    if (error.stack) {
      console.error("Stack:", error.stack);
    }
    console.error("================================\n");

    const generation = generationsStore.get(generationId);
    if (generation) {
      generation.status = "failed";
      generation.errorMessage = error.message || "Unknown error";
    }

    const tempVideoPath = path.join(outputsDir, `${generationId}_temp.mp4`);
    if (fs.existsSync(tempVideoPath)) {
      fs.unlinkSync(tempVideoPath);
      console.log("🧹 Temp file cleaned up");
    }
  }
}

// Get generation status
router.get("/status/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    console.log(`📊 Status check for: ${id}`);

    const generation = generationsStore.get(id);

    if (!generation) {
      console.log(`❌ Generation not found: ${id}`);
      res.status(404).json({
        success: false,
        error: "Generation not found",
      });
      return;
    }

    console.log(`✅ Status: ${generation.status}`);

    res.json({
      success: true,
      generation: {
        id: generation.id,
        status: generation.status,
        prompt: generation.prompt,
        model: generation.model,
        duration: generation.duration,
        aspectRatio: generation.aspectRatio,
        videoUrl: generation.videoUrl,
        thumbnailUrl: generation.thumbnailUrl,
        errorMessage: generation.errorMessage,
        createdAt: generation.createdAt,
        completedAt: generation.completedAt,
      },
    });
  } catch (error: any) {
    console.error("❌ Status check error:", error.message);
    res.status(500).json({
      success: false,
      error: "Failed to fetch generation status",
      details: error.message,
    });
  }
});

// Test endpoint - minimal config to isolate the issue
router.post("/test", async (req: Request, res: Response): Promise<void> => {
  console.log("\n🧪 ===== VEO3 Test =====");
  const startTime = Date.now();

  try {
    const { prompt } = req.body;

    if (!prompt || prompt.trim().length === 0) {
      console.error("❌ No prompt provided");
      res.status(400).json({ success: false, error: "Prompt is required" });
      return;
    }

    console.log("📝 Test prompt:", prompt);

    if (!process.env.GOOGLE_AI_STUDIO) {
      console.error("❌ Google AI Studio API key not configured");
      res.status(500).json({
        success: false,
        error: "Service configuration error",
        details: "Google AI Studio not configured",
      });
      return;
    }

    console.log("✅ Configuration validated");

    // Minimal API call - no config at all
    console.log("\n📤 Calling VEO API (no config)...");
    let operation = await ai.models.generateVideos({
      model: "veo-3.1-generate-preview",
      prompt: prompt,
    });

    console.log("✅ Operation started");
    console.log("   Operation ID:", operation.name);

    console.log("\n⏳ Waiting for completion...");
    let attempts = 0;
    const maxAttempts = 60;

    while (!operation.done && attempts < maxAttempts) {
      attempts++;
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(0);
      console.log(`   Polling... (${attempts}/${maxAttempts}) - Elapsed: ${elapsed}s`);

      await new Promise((resolve) => setTimeout(resolve, 10000));
      operation = await ai.operations.getVideosOperation({ operation });
    }

    if (!operation.done) {
      throw new Error("Timeout - video generation took too long");
    }

    if (!operation.response?.generatedVideos?.[0]) {
      throw new Error("No video generated in response");
    }

    const testTime = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log("\n✅ ===== Test Complete =====");
    console.log(`   Total time: ${testTime}s`);
    console.log("============================\n");

    res.json({
      success: true,
      message: "Test video generated successfully!",
      operationName: operation.name,
      videoGenerated: true,
      processingTime: parseFloat(testTime),
    });
  } catch (error: any) {
    console.error("\n❌ ===== TEST ERROR =====");
    console.error("Type:", error.constructor ? error.constructor.name : "Unknown");
    console.error("Message:", error.message);
    console.error("=========================\n");

    res.status(500).json({
      success: false,
      error: error.message || "Failed to generate test video",
      details: error.message,
    });
  }
});

// Health check
router.get("/health", (req: Request, res: Response) => {
  const status = {
    status: "ok",
    service: "veo3-video-generation",
    timestamp: new Date().toISOString(),
    config: {
      googleAI: !!process.env.GOOGLE_AI_STUDIO,
      cloudinary: {
        cloud_name: !!process.env.CLOUDINARY_CLOUD_NAME,
        api_key: !!process.env.CLOUDINARY_API_KEY,
        api_secret: !!process.env.CLOUDINARY_API_SECRET,
      },
    },
    stats: {
      activeGenerations: generationsStore.size,
      pendingGenerations: Array.from(generationsStore.values()).filter(
        (g) => g.status === "pending"
      ).length,
      processingGenerations: Array.from(generationsStore.values()).filter(
        (g) => g.status === "processing"
      ).length,
      completedGenerations: Array.from(generationsStore.values()).filter(
        (g) => g.status === "completed"
      ).length,
      failedGenerations: Array.from(generationsStore.values()).filter(
        (g) => g.status === "failed"
        
      ).length,
    },
  };

  console.log("🏥 Health check:", status);
  res.json(status);
});

export default router;