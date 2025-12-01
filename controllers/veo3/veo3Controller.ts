import type { Request, Response } from "express";
import { GoogleGenAI } from "@google/genai";
import { db } from "../../db/client.ts";
import { veo3Generations } from "../../db/schema.ts";
import { eq, desc } from "drizzle-orm";
import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Initialize Google Gemini AI
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Only Veo 3.1 models are supported by generateVideos right now.
const SUPPORTED_MODELS = new Set([
  "veo-3.1-generate-preview",
  "veo-3.1-fast-generate-preview",
]);

/**
 * Generate video using Google Gemini VEO3
 * POST /api/veo3/generate
 */
export const generateVideo = async (req: Request, res: Response) => {
  try {
    const authUser = (req as any).user;
    const userId = authUser?.id ?? authUser?.userId;

    if (!userId) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    const { prompt, model, duration, aspectRatio } = req.body;

    if (!prompt || prompt.trim().length === 0) {
      return res.status(400).json({ success: false, error: "Prompt is required" });
    }

    // Normalize model selection
    const requestedModel = typeof model === "string" ? model : "";
    const modelId = SUPPORTED_MODELS.has(requestedModel)
      ? requestedModel
      : "veo-3.1-generate-preview";

    // Clamp duration between 4s and 8s (Gemini’s allowed range)
    const parsedDuration = Number(duration);
    const durationSeconds = Number.isFinite(parsedDuration)
      ? Math.min(Math.max(parsedDuration, 4), 8)
      : 8;

    const ratio = aspectRatio || "16:9";

    const [generation] = await db
      .insert(veo3Generations)
      .values({
        userId,
        prompt: prompt.trim(),
        model: modelId,
        duration: `${durationSeconds}s`,
        aspectRatio: ratio,
        status: "pending",
      })
      .returning();

    console.log(`[VEO3] Created generation record: ${generation.id}`);

    res.status(202).json({
      success: true,
      generation: {
        id: generation.id,
        status: "pending",
        message: "Video generation started",
      },
    });

    processVideoGeneration(
      generation.id,
      prompt.trim(),
      modelId,
      durationSeconds,
      ratio
    ).catch((error) => {
      console.error(`[VEO3] Async processing error for ${generation.id}:`, error);
    });
  } catch (error) {
    console.error("[VEO3] Generation error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to start video generation",
    });
  }
};

/**
 * Process video generation using Google Gemini VEO3
 */
async function processVideoGeneration(
  generationId: string,
  prompt: string,
  model: string,
  duration: number,
  aspectRatio: string
) {
  try {
    console.log(`[VEO3] Starting generation for: ${generationId}`);
    console.log(`[VEO3] Model: ${model}, Duration: ${duration}s, Aspect: ${aspectRatio}`);

    // Update status to processing
    await db
      .update(veo3Generations)
      .set({ status: "processing" })
      .where(eq(veo3Generations.id, generationId));

    // Generate video using Google Gemini VEO3
    let operation = await ai.models.generateVideos({
      model: model,
      prompt: prompt,
      config: {
        aspectRatio: aspectRatio,
        durationSeconds: duration,
        resolution: "720p", // or "1080p" for higher quality
        
      },
    });

    console.log(`[VEO3] Operation started: ${operation.name}`);

    // Poll the operation status until video is ready
    let attempts = 0;
    const maxAttempts = 60; // 10 minutes max (10s interval)

    while (!operation.done && attempts < maxAttempts) {
      console.log(`[VEO3] Waiting... (${attempts + 1}/${maxAttempts})`);
      await new Promise((resolve) => setTimeout(resolve, 10000)); // Wait 10 seconds
      operation = await ai.operations.getVideosOperation({ operation });
      attempts++;
    }

    if (!operation.done) {
      throw new Error("Video generation timeout");
    }

    if (!operation.response?.generatedVideos?.[0]) {
      throw new Error("No video generated");
    }

    console.log(`[VEO3] Video generation completed`);

    const generatedVideo = operation.response.generatedVideos[0];
    
    // Create temp directory if it doesn't exist
   const outputsDir = path.join(__dirname, "../outputs");
    if (!fs.existsSync(outputsDir)) {
      fs.mkdirSync(outputsDir, { recursive: true });
    }

    // Download the video file
    const tempVideoPath = path.join(outputsDir, `${generationId}_temp.mp4`);
    
    await ai.files.download({
      file: generatedVideo.video,
      downloadPath: tempVideoPath,
    });

    console.log(`[VEO3] Video downloaded to: ${tempVideoPath}`);

    // Upload to Cloudinary
    const cloudinaryResult = await cloudinary.uploader.upload(tempVideoPath, {
      resource_type: "video",
      folder: "veo3_generations",
      public_id: generationId,
    });

    console.log(`[VEO3] Uploaded to Cloudinary: ${cloudinaryResult.secure_url}`);

    // Generate thumbnail
    const thumbnailUrl = cloudinary.url(generationId, {
      resource_type: "video",
      format: "jpg",
      transformation: [{ width: 640, height: 360, crop: "fill", start_offset: "1" }],
    });

    // Clean up temp file
    if (fs.existsSync(tempVideoPath)) {
      fs.unlinkSync(tempVideoPath);
    }

    // Update generation record with success
    await db
      .update(veo3Generations)
      .set({
        status: "completed",
        videoUrl: cloudinaryResult.secure_url,
        thumbnailUrl,
        completedAt: new Date(),
        metadata: {
          duration: cloudinaryResult.duration,
          format: cloudinaryResult.format,
          size: cloudinaryResult.bytes,
          width: cloudinaryResult.width,
          height: cloudinaryResult.height,
        },
      })
      .where(eq(veo3Generations.id, generationId));

    console.log(`[VEO3] ✅ Completed: ${generationId}`);
  } catch (error) {
    console.error(`[VEO3] ❌ Error:`, error);
    
    await db
      .update(veo3Generations)
      .set({
        status: "failed",
        errorMessage: error instanceof Error ? error.message : "Unknown error",
      })
      .where(eq(veo3Generations.id, generationId));
  }
}

/**
 * Get user's VEO3 generations
 * GET /api/veo3/generations
 */
export const getGenerations = async (req: Request, res: Response) => {
  try {
    const authUser = (req as any).user;
const userId = authUser?.id ?? authUser?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;

    const generations = await db
      .select()
      .from(veo3Generations)
      .where(eq(veo3Generations.userId, userId))
      .orderBy(desc(veo3Generations.createdAt))
      .limit(limit)
      .offset(offset);

    res.json({ success: true, generations });
  } catch (error) {
    console.error("[VEO3] Get generations error:", error);
    res.status(500).json({ success: false, error: "Failed to fetch generations" });
  }
};

/**
 * Get single generation by ID
 * GET /api/veo3/generations/:id
 */
export const getGenerationById = async (req: Request, res: Response) => {
  try {
    const authUser = (req as any).user;
const userId = authUser?.id ?? authUser?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    const { id } = req.params;

    const [generation] = await db
      .select()
      .from(veo3Generations)
      .where(eq(veo3Generations.id, id));

    if (!generation) {
      return res.status(404).json({ success: false, error: "Generation not found" });
    }

    if (generation.userId !== userId) {
      return res.status(403).json({ success: false, error: "Forbidden" });
    }

    res.json({ success: true, generation });
  } catch (error) {
    console.error("[VEO3] Get generation error:", error);
    res.status(500).json({ success: false, error: "Failed to fetch generation" });
  }
};

/**
 * Delete generation
 * DELETE /api/veo3/generations/:id
 */
export const deleteGeneration = async (req: Request, res: Response) => {
  try {
    const authUser = (req as any).user;
const userId = authUser?.id ?? authUser?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    const { id } = req.params;

    const [generation] = await db
      .select()
      .from(veo3Generations)
      .where(eq(veo3Generations.id, id));

    if (!generation) {
      return res.status(404).json({ success: false, error: "Generation not found" });
    }

    if (generation.userId !== userId) {
      return res.status(403).json({ success: false, error: "Forbidden" });
    }

    // Delete from Cloudinary
    if (generation.videoUrl) {
      try {
        await cloudinary.uploader.destroy(id, { resource_type: "video" });
      } catch (cloudError) {
        console.error("[VEO3] Cloudinary deletion error:", cloudError);
      }
    }

    // Delete from database
    await db.delete(veo3Generations).where(eq(veo3Generations.id, id));

    res.json({ success: true, message: "Generation deleted successfully" });
  } catch (error) {
    console.error("[VEO3] Delete generation error:", error);
    res.status(500).json({ success: false, error: "Failed to delete generation" });
  }

  

};

export const testGenerateVideo = async (req: Request, res: Response) => {
  try {
    const { prompt } = req.body;

    if (!prompt || prompt.trim().length === 0) {
      return res.status(400).json({ success: false, error: "Prompt is required" });
    }

    console.log(`[VEO3 TEST] Starting test with prompt: ${prompt}`);

    // Generate video with minimal config
    let operation = await ai.models.generateVideos({
      model: "veo-3.1-generate-preview",
      prompt: prompt,
      // ✅ Use defaults - no config
    });

    console.log(`[VEO3 TEST] Operation started: ${operation.name}`);

    let attempts = 0;
    const maxAttempts = 60;

    while (!operation.done && attempts < maxAttempts) {
      console.log(`[VEO3 TEST] Waiting... (${attempts + 1}/${maxAttempts})`);
      await new Promise((resolve) => setTimeout(resolve, 10000));
      operation = await ai.operations.getVideosOperation({ operation });
      attempts++;
    }

    if (!operation.done) {
      throw new Error("Timeout - video generation took too long");
    }

    if (!operation.response?.generatedVideos?.[0]) {
      throw new Error("No video generated in response");
    }

    const generatedVideo = operation.response.generatedVideos[0];
    
    console.log(`[VEO3 TEST] ✅ Video generated successfully!`);

    res.json({
      success: true,
      message: "Test video generated successfully!",
      operationName: operation.name,
      videoGenerated: true,
    });

  } catch (error) {
    console.error("[VEO3 TEST] ❌ Error:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to generate test video",
    });
  }
};