import type { Request, Response } from "express";
import { GoogleGenAI } from "@google/genai";
import { db } from "../../db/client.ts";
import { veo3Generations } from "../../db/schema.ts";
import { eq, desc } from "drizzle-orm";
import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
<<<<<<< HEAD

// Initialize Google Gemini AI
=======
import axios from "axios";

>>>>>>> origin/veo3-backend
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

<<<<<<< HEAD
// Only Veo 3.1 models are supported by generateVideos right now.
=======
>>>>>>> origin/veo3-backend
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

<<<<<<< HEAD
    const { prompt, model, duration, aspectRatio } = req.body;

    if (!prompt || prompt.trim().length === 0) {
      return res.status(400).json({ success: false, error: "Prompt is required" });
    }

    // Normalize model selection
=======
    const { prompt, model, duration, aspectRatio, referenceType } = req.body;

    if (!prompt || prompt.trim().length === 0) {
      return res
        .status(400)
        .json({ success: false, error: "Prompt is required" });
    }

    // Handle reference image from multer
    const file = (req as any).file as Express.Multer.File | undefined;
    let referenceImageUrl: string | null = null;

    if (file) {
      try {
        const uploadResult = await cloudinary.uploader.upload(file.path, {
          folder: "veo3_reference_images",
          resource_type: "image",
        });
        referenceImageUrl = uploadResult.secure_url;
        console.log("[VEO3] Reference image uploaded:", referenceImageUrl);
      } catch (uploadErr) {
        console.error("[VEO3] Reference image upload error:", uploadErr);
      } finally {
        if (file.path && fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      }
    }

    // Normalize model
>>>>>>> origin/veo3-backend
    const requestedModel = typeof model === "string" ? model : "";
    const modelId = SUPPORTED_MODELS.has(requestedModel)
      ? requestedModel
      : "veo-3.1-generate-preview";

<<<<<<< HEAD
    // Clamp duration between 4s and 8s (Gemini’s allowed range)
    const parsedDuration = Number(duration);
    const durationSeconds = Number.isFinite(parsedDuration)
      ? Math.min(Math.max(parsedDuration, 4), 8)
      : 8;

    const ratio = aspectRatio || "16:9";

=======
    // ✅ FIX: Only allow 4s or 8s
    const parsedDuration = Number(duration);
    const durationSeconds = parsedDuration === 4 ? 4 : 8;

    const ratio = aspectRatio || "16:9";

    // ✅ Store reference type
    const refType = referenceType || 'ASSET';

>>>>>>> origin/veo3-backend
    const [generation] = await db
      .insert(veo3Generations)
      .values({
        userId,
        prompt: prompt.trim(),
        model: modelId,
        duration: `${durationSeconds}s`,
        aspectRatio: ratio,
        status: "pending",
<<<<<<< HEAD
=======
        referenceImageUrl,
        referenceType: refType, 
>>>>>>> origin/veo3-backend
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
<<<<<<< HEAD
      ratio
    ).catch((error) => {
      console.error(`[VEO3] Async processing error for ${generation.id}:`, error);
=======
      ratio,
      referenceImageUrl,
      refType 
    ).catch((error) => {
      console.error(
        `[VEO3] Async processing error for ${generation.id}:`,
        error
      );
>>>>>>> origin/veo3-backend
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
<<<<<<< HEAD
  aspectRatio: string
) {
  try {
    console.log(`[VEO3] Starting generation for: ${generationId}`);
    console.log(`[VEO3] Model: ${model}, Duration: ${duration}s, Aspect: ${aspectRatio}`);

    // Update status to processing
=======
  aspectRatio: string,
  referenceImageUrl?: string | null,
  referenceType?: string
) {
  try {
    console.log(`[VEO3] Starting generation for: ${generationId}`);
    console.log(
      `[VEO3] Model: ${model}, Duration: ${duration}s, Aspect: ${aspectRatio}`
    );

>>>>>>> origin/veo3-backend
    await db
      .update(veo3Generations)
      .set({ status: "processing" })
      .where(eq(veo3Generations.id, generationId));

<<<<<<< HEAD
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
=======
    // ✅ Build config with reference image support
    const config: any = {
      aspectRatio,
      durationSeconds: duration,
      resolution: "720p",
    };

    // ❌ TEMPORARILY DISABLE REFERENCE IMAGES UNTIL GOOGLE ENABLES IT
    // if (referenceImageUrl) {
    //   console.log(`[VEO3] Fetching reference image: ${referenceImageUrl}`);
      
    //   try {
    //     // Download the image from Cloudinary
    //     const imageResponse = await axios.get(referenceImageUrl, {
    //       responseType: 'arraybuffer',
    //       timeout: 30000, // 30 second timeout
    //     });
        
    //     const imageBuffer = Buffer.from(imageResponse.data);
    //     const imageBase64 = imageBuffer.toString('base64');
        
    //     // Infer MIME type from URL
    //     const mimeType = referenceImageUrl.match(/\.(jpg|jpeg)$/i) 
    //       ? 'image/jpeg' 
    //       : referenceImageUrl.match(/\.png$/i)
    //       ? 'image/png'
    //       : 'image/jpeg';
        
    //     config.referenceImages = [
    //       {
    //         image: {
    //           imageBytes: imageBase64,
    //           mimeType: mimeType,
    //         },
    //         referenceType: referenceType || 'ASSET',
    //       }
    //     ];
        
    //     console.log(
    //       `[VEO3] Reference image added to config (type: ${referenceType || 'ASSET'})`
    //     );
    //   } catch (imgError) {
    //     console.error('[VEO3] Failed to fetch reference image:', imgError);
    //     // Continue without reference image rather than failing
    //   }
    // }

    console.log(`[VEO3] Calling ai.models.generateVideos...`);

    const operationStart = await ai.models.generateVideos({
      model,
      prompt: prompt,
      config: config,
    });

    let operation = operationStart;
    console.log(`[VEO3] Operation started: ${operation.name}`);

    // Poll for completion
    let attempts = 0;
    const maxAttempts = 60;
    while (!operation.done && attempts < maxAttempts) {
      console.log(`[VEO3] Waiting... (${attempts + 1}/${maxAttempts})`);
      await new Promise((resolve) => setTimeout(resolve, 10000));
>>>>>>> origin/veo3-backend
      operation = await ai.operations.getVideosOperation({ operation });
      attempts++;
    }

    if (!operation.done) {
      throw new Error("Video generation timeout");
    }
<<<<<<< HEAD

=======
>>>>>>> origin/veo3-backend
    if (!operation.response?.generatedVideos?.[0]) {
      throw new Error("No video generated");
    }

<<<<<<< HEAD
    console.log(`[VEO3] Video generation completed`);

    const generatedVideo = operation.response.generatedVideos[0];
    
    // Create temp directory if it doesn't exist
   const outputsDir = path.join(__dirname, "../outputs");
=======
    console.log(`[VEO3] Video generation completed for ${generationId}`);
    const generatedVideo = operation.response.generatedVideos[0];

    // Create temp directory
    const outputsDir = path.join(__dirname, "../../outputs");
>>>>>>> origin/veo3-backend
    if (!fs.existsSync(outputsDir)) {
      fs.mkdirSync(outputsDir, { recursive: true });
    }

<<<<<<< HEAD
    // Download the video file
    const tempVideoPath = path.join(outputsDir, `${generationId}_temp.mp4`);
    
=======
    // Download video
    const tempVideoPath = path.join(outputsDir, `${generationId}_temp.mp4`);
>>>>>>> origin/veo3-backend
    await ai.files.download({
      file: generatedVideo.video,
      downloadPath: tempVideoPath,
    });
<<<<<<< HEAD

=======
>>>>>>> origin/veo3-backend
    console.log(`[VEO3] Video downloaded to: ${tempVideoPath}`);

    // Upload to Cloudinary
    const cloudinaryResult = await cloudinary.uploader.upload(tempVideoPath, {
      resource_type: "video",
      folder: "veo3_generations",
      public_id: generationId,
    });
<<<<<<< HEAD

    console.log(`[VEO3] Uploaded to Cloudinary: ${cloudinaryResult.secure_url}`);
=======
    console.log(
      `[VEO3] Uploaded to Cloudinary: ${cloudinaryResult.secure_url}`
    );
>>>>>>> origin/veo3-backend

    // Generate thumbnail
    const thumbnailUrl = cloudinary.url(generationId, {
      resource_type: "video",
      format: "jpg",
<<<<<<< HEAD
      transformation: [{ width: 640, height: 360, crop: "fill", start_offset: "1" }],
=======
      transformation: [
        { width: 640, height: 360, crop: "fill", start_offset: "1" },
      ],
>>>>>>> origin/veo3-backend
    });

    // Clean up temp file
    if (fs.existsSync(tempVideoPath)) {
      fs.unlinkSync(tempVideoPath);
    }

<<<<<<< HEAD
    // Update generation record with success
=======
    // Update generation record
>>>>>>> origin/veo3-backend
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
<<<<<<< HEAD
=======
          referenceImageUsed: !!referenceImageUrl,
          referenceType: referenceType,
>>>>>>> origin/veo3-backend
        },
      })
      .where(eq(veo3Generations.id, generationId));

    console.log(`[VEO3] ✅ Completed: ${generationId}`);
  } catch (error) {
    console.error(`[VEO3] ❌ Error:`, error);
<<<<<<< HEAD
    
=======

>>>>>>> origin/veo3-backend
    await db
      .update(veo3Generations)
      .set({
        status: "failed",
<<<<<<< HEAD
        errorMessage: error instanceof Error ? error.message : "Unknown error",
=======
        errorMessage:
          error instanceof Error ? error.message : "Unknown error",
>>>>>>> origin/veo3-backend
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
<<<<<<< HEAD
const userId = authUser?.id ?? authUser?.userId;
=======
    const userId = authUser?.id ?? authUser?.userId;
>>>>>>> origin/veo3-backend
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
<<<<<<< HEAD
    res.status(500).json({ success: false, error: "Failed to fetch generations" });
=======
    res
      .status(500)
      .json({ success: false, error: "Failed to fetch generations" });
>>>>>>> origin/veo3-backend
  }
};

/**
 * Get single generation by ID
 * GET /api/veo3/generations/:id
 */
export const getGenerationById = async (req: Request, res: Response) => {
  try {
    const authUser = (req as any).user;
<<<<<<< HEAD
const userId = authUser?.id ?? authUser?.userId;
=======
    const userId = authUser?.id ?? authUser?.userId;
>>>>>>> origin/veo3-backend
    if (!userId) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    const { id } = req.params;

    const [generation] = await db
      .select()
      .from(veo3Generations)
      .where(eq(veo3Generations.id, id));

    if (!generation) {
<<<<<<< HEAD
      return res.status(404).json({ success: false, error: "Generation not found" });
=======
      return res
        .status(404)
        .json({ success: false, error: "Generation not found" });
>>>>>>> origin/veo3-backend
    }

    if (generation.userId !== userId) {
      return res.status(403).json({ success: false, error: "Forbidden" });
    }

    res.json({ success: true, generation });
  } catch (error) {
    console.error("[VEO3] Get generation error:", error);
<<<<<<< HEAD
    res.status(500).json({ success: false, error: "Failed to fetch generation" });
=======
    res
      .status(500)
      .json({ success: false, error: "Failed to fetch generation" });
>>>>>>> origin/veo3-backend
  }
};

/**
 * Delete generation
 * DELETE /api/veo3/generations/:id
 */
export const deleteGeneration = async (req: Request, res: Response) => {
  try {
    const authUser = (req as any).user;
<<<<<<< HEAD
const userId = authUser?.id ?? authUser?.userId;
=======
    const userId = authUser?.id ?? authUser?.userId;
>>>>>>> origin/veo3-backend
    if (!userId) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    const { id } = req.params;

    const [generation] = await db
      .select()
      .from(veo3Generations)
      .where(eq(veo3Generations.id, id));

    if (!generation) {
<<<<<<< HEAD
      return res.status(404).json({ success: false, error: "Generation not found" });
=======
      return res
        .status(404)
        .json({ success: false, error: "Generation not found" });
>>>>>>> origin/veo3-backend
    }

    if (generation.userId !== userId) {
      return res.status(403).json({ success: false, error: "Forbidden" });
    }

<<<<<<< HEAD
=======
    if (generation.referenceImageUrl) {
      try {
        const url = new URL(generation.referenceImageUrl);
        const parts = url.pathname.split("/");

        const filename = parts[parts.length - 1];
        const folder = parts[parts.length - 2];
        const publicId = `${folder}/${filename.split(".")[0]}`;

        await cloudinary.uploader.destroy(publicId, { resource_type: "image" });
        console.log(
          "[VEO3] Reference image deleted from Cloudinary:",
          publicId
        );
      } catch (refErr) {
        console.error("[VEO3] Reference image deletion error:", refErr);
      }
    }

>>>>>>> origin/veo3-backend
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
<<<<<<< HEAD
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
=======
    res
      .status(500)
      .json({ success: false, error: "Failed to delete generation" });
  }
};
>>>>>>> origin/veo3-backend
