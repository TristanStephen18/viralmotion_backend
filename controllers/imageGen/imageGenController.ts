import type { Request, Response } from "express";
import { db } from "../../db/client.ts";
import { imageGenerations } from "../../db/schema.ts";
import { eq, desc } from "drizzle-orm";
import cloudinary from "../../utils/cloudinaryClient.ts";
import axios from "axios";

/**
 * Save image generation
 * POST /api/image-generation/save
 */
export const saveImageGeneration = async (req: Request, res: Response) => {
  try {
    const authUser = (req as any).user;
    const userId = authUser?.id ?? authUser?.userId;

    if (!userId) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    const { prompt, model, aspectRatio, imageUrl } = req.body;

    if (!prompt || !model || !aspectRatio || !imageUrl) {
      return res.status(400).json({ 
        success: false, 
        error: "Missing required fields" 
      });
    }

    // Optional: Upload to Cloudinary for permanent storage
    let permanentUrl = imageUrl;
    try {
      // Download image from Pollinations and re-upload to Cloudinary
      const imageResponse = await axios.get(imageUrl, {
        responseType: 'arraybuffer',
        timeout: 30000,
      });

      const imageBuffer = Buffer.from(imageResponse.data);

      const uploadResult = await new Promise<any>((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: "ai_image_generations",
            resource_type: "image",
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        stream.end(imageBuffer);
      });

      permanentUrl = uploadResult.secure_url;
      console.log("[ImageGen] Uploaded to Cloudinary:", permanentUrl);
    } catch (uploadErr) {
      console.error("[ImageGen] Cloudinary upload failed, using original URL:", uploadErr);
      // Continue with original URL if upload fails
    }

    const [generation] = await db
      .insert(imageGenerations)
      .values({
        userId,
        prompt: prompt.trim(),
        model,
        aspectRatio,
        imageUrl: permanentUrl,
        status: "completed",
        metadata: {
          originalUrl: imageUrl,
          uploadedToCloudinary: permanentUrl !== imageUrl,
        },
      })
      .returning();

    console.log(`[ImageGen] Saved generation: ${generation.id}`);

    res.status(201).json({
      success: true,
      generation,
    });
  } catch (error) {
    console.error("[ImageGen] Save error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to save image generation",
    });
  }
};

/**
 * Get user's image generations
 * GET /api/image-generation/generations
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
      .from(imageGenerations)
      .where(eq(imageGenerations.userId, userId))
      .orderBy(desc(imageGenerations.createdAt))
      .limit(limit)
      .offset(offset);

    res.json({ success: true, generations });
  } catch (error) {
    console.error("[ImageGen] Get generations error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch generations",
    });
  }
};

/**
 * Delete generation
 * DELETE /api/image-generation/generations/:id
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
      .from(imageGenerations)
      .where(eq(imageGenerations.id, id));

    if (!generation) {
      return res.status(404).json({
        success: false,
        error: "Generation not found",
      });
    }

    if (generation.userId !== userId) {
      return res.status(403).json({ success: false, error: "Forbidden" });
    }

    // Try to delete from Cloudinary if it's a Cloudinary URL
    if (generation.imageUrl.includes("cloudinary.com")) {
      try {
        const urlParts = generation.imageUrl.split("/");
        const filename = urlParts[urlParts.length - 1];
        const folder = urlParts[urlParts.length - 2];
        const publicId = `${folder}/${filename.split(".")[0]}`;

        await cloudinary.uploader.destroy(publicId, { resource_type: "image" });
        console.log("[ImageGen] Deleted from Cloudinary:", publicId);
      } catch (cloudError) {
        console.error("[ImageGen] Cloudinary deletion error:", cloudError);
      }
    }

    await db.delete(imageGenerations).where(eq(imageGenerations.id, id));

    res.json({ success: true, message: "Generation deleted successfully" });
  } catch (error) {
    console.error("[ImageGen] Delete generation error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete generation",
    });
  }
};