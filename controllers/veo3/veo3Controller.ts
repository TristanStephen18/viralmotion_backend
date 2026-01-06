import type { Request, Response } from "express";
import { GoogleGenAI } from "@google/genai";
import { db } from "../../db/client.ts";
import { veo3Generations } from "../../db/schema.ts";
import { eq, desc } from "drizzle-orm";
import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { checkAIGenerationAllowed, incrementAIGeneration } from "../../utils/usageHelper.ts";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

    const { prompt, model, duration, aspectRatio, referenceType } = req.body;

    if (!prompt || prompt.trim().length === 0) {
      return res
        .status(400)
        .json({ success: false, error: "Prompt is required" });
    }

    // Check usage limit
    const usageCheck = await checkAIGenerationAllowed(userId);
    if (!usageCheck.allowed) {
      return res.status(429).json({ success: false, error: "AI generation limit reached", usageInfo: usageCheck });
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
    const requestedModel = typeof model === "string" ? model : "";
    const modelId = SUPPORTED_MODELS.has(requestedModel)
      ? requestedModel
      : "veo-3.1-generate-preview";

    // ✅ FIX: Only allow 4s or 8s
    const parsedDuration = Number(duration);
    const durationSeconds = parsedDuration === 4 ? 4 : 8;

    const ratio = aspectRatio || "16:9";

    // ✅ Store reference type
    const refType = referenceType || 'ASSET';

    const [generation] = await db
      .insert(veo3Generations)
      .values({
        userId,
        prompt: prompt.trim(),
        model: modelId,
        duration: `${durationSeconds}s`,
        aspectRatio: ratio,
        status: "pending",
        referenceImageUrl,
        referenceType: refType, 
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
      ratio,
      referenceImageUrl,
      refType,
      userId
    ).catch((error) => {
      console.error(
        `[VEO3] Async processing error for ${generation.id}:`,
        error
      );
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
  aspectRatio: string,
  referenceImageUrl?: string | null,
  referenceType?: string,
  userId?: number
) {
  try {
    console.log(`[VEO3] Starting generation for: ${generationId}`);
    console.log(
      `[VEO3] Model: ${model}, Duration: ${duration}s, Aspect: ${aspectRatio}`
    );

    await db
      .update(veo3Generations)
      .set({ status: "processing" })
      .where(eq(veo3Generations.id, generationId));

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
      operation = await ai.operations.getVideosOperation({ operation });
      attempts++;
    }

    if (!operation.done) {
      throw new Error("Video generation timeout");
    }
    if (!operation.response?.generatedVideos?.[0]) {
      throw new Error("No video generated");
    }

    console.log(`[VEO3] Video generation completed for ${generationId}`);
    const generatedVideo = operation.response.generatedVideos[0];

    // Create temp directory
    const outputsDir = path.join(__dirname, "../../outputs");
    if (!fs.existsSync(outputsDir)) {
      fs.mkdirSync(outputsDir, { recursive: true });
    }

    // Download video
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
    console.log(
      `[VEO3] Uploaded to Cloudinary: ${cloudinaryResult.secure_url}`
    );

    // Generate thumbnail
    const thumbnailUrl = cloudinary.url(generationId, {
      resource_type: "video",
      format: "jpg",
      transformation: [
        { width: 640, height: 360, crop: "fill", start_offset: "1" },
      ],
    });

    // Clean up temp file
    if (fs.existsSync(tempVideoPath)) {
      fs.unlinkSync(tempVideoPath);
    }

    // Update generation record
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
          referenceImageUsed: !!referenceImageUrl,
          referenceType: referenceType,
        },
      })
      .where(eq(veo3Generations.id, generationId));

    // Increment usage after successful completion
    if (userId) {
      await incrementAIGeneration(userId);
    }

    console.log(`[VEO3] ✅ Completed: ${generationId}`);
  } catch (error) {
    console.error(`[VEO3] ❌ Error:`, error);
    await db
      .update(veo3Generations)
      .set({
        status: "failed",
        errorMessage:
          error instanceof Error ? error.message : "Unknown error",
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
    res
      .status(500)
      .json({ success: false, error: "Failed to fetch generations" });
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
      return res
        .status(404)
        .json({ success: false, error: "Generation not found" });
    }

    if (generation.userId !== userId) {
      return res.status(403).json({ success: false, error: "Forbidden" });
    }

    res.json({ success: true, generation });
  } catch (error) {
    console.error("[VEO3] Get generation error:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to fetch generation" });
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
      return res
        .status(404)
        .json({ success: false, error: "Generation not found" });
    }

    if (generation.userId !== userId) {
      return res.status(403).json({ success: false, error: "Forbidden" });
    }

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
    res
      .status(500)
      .json({ success: false, error: "Failed to delete generation" });
  }
};
