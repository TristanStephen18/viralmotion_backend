
//controllers/imageGen/imageGenController.ts
import type { Request, Response } from "express";
import { db } from "../../db/client.ts";
import { imageGenerations } from "../../db/schema.ts";
import { eq, desc } from "drizzle-orm";
import cloudinary from "../../utils/cloudinaryClient.ts";
import axios from "axios";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { nanoBananaService } from "../../services/nanoBanana.service.ts"; // ✨ NEW

// Initialize Gemini for prompt improvement
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const textModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

function getSystemPromptForModel(modelType?: string): string {
  switch (modelType) {
    case "flux-realism":
      return "You are an expert at creating photorealistic image prompts. Enhance prompts with realistic details, proper lighting (golden hour, soft natural light, etc.), camera settings (depth of field, bokeh), and natural elements.";
    
    case "flux-anime":
      return "You are an expert at creating anime-style image prompts. Enhance prompts with anime aesthetics, character details (expressive eyes, dynamic poses), vibrant colors, cel-shading, and manga/anime art style elements.";
    
    case "turbo":
      return "You are an expert at creating creative and artistic image prompts for the Turbo model. This model excels at fast, experimental, and creative outputs. Enhance prompts with imaginative details, unique artistic styles, bold colors, surreal elements, and experimental visual concepts.";
    
    case "gemini-2.5-flash-image":
    case "gemini-2.5-flash-image-preview":
    case "gemini-3-pro-image-preview":
    case "nano-banana-pro-preview":
      return "You are an expert at creating prompts for Google's Gemini image generation models (Nano Banana). Enhance prompts with photorealistic details, artistic elements, vivid colors, precise composition descriptions, and creative visual concepts.";
    
    case "imagen-3":
    case "imagen-4":
      return "You are an expert at creating prompts for Google's Imagen model. Enhance prompts with photorealistic details, natural lighting, vivid colors, and precise composition descriptions. Focus on clarity and visual accuracy.";
    
    case "flux":
    default:
      return "You are an expert at creating detailed image generation prompts. Enhance prompts with vivid descriptions, artistic elements, visual details, and creative direction.";
  }
}
export const saveImageGeneration = async (req: Request, res: Response) => {
  try {
    const authUser = (req as any).user;
    const userId = authUser?.id ?? authUser?.userId;

    if (!userId) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    const { prompt, model, aspectRatio, imageUrl } = req.body;

    if (!prompt || !model || !aspectRatio || !imageUrl) {
      return res.status(400).json({ success: false, error: "Missing required fields" });
    }

    let permanentUrl = imageUrl;
    
    // Skip if already uploaded to Cloudinary
    if (imageUrl.includes("cloudinary.com")) {
      permanentUrl = imageUrl;
    }
    // Handle base64 images (from Nano Banana)
    else if (imageUrl.startsWith("data:image")) {
      try {
        console.log("[ImageGen] Uploading base64 image to Cloudinary...");
        
        // Upload base64 directly to Cloudinary
        const uploadResult = await cloudinary.uploader.upload(imageUrl, {
          folder: "ai_image_generations",
          resource_type: "image",
        });

        permanentUrl = uploadResult.secure_url;
        console.log("[ImageGen] ✅ Base64 uploaded to Cloudinary:", permanentUrl);
      } catch (uploadErr) {
        console.error("[ImageGen] ❌ Cloudinary upload failed for base64:", uploadErr);
        // Keep base64 as fallback
        console.warn("[ImageGen] ⚠️ Using base64 URL as fallback");
      }
    }
    // Handle regular URLs (from Pollinations)
    else {
      try {
        console.log("[ImageGen] Downloading and uploading URL to Cloudinary...");
        
        const imageResponse = await axios.get(imageUrl, {
          responseType: 'arraybuffer',
          timeout: 30000,
        });

        const imageBuffer = Buffer.from(imageResponse.data);

        const uploadResult = await new Promise<any>((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            { folder: "ai_image_generations", resource_type: "image" },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          );
          stream.end(imageBuffer);
        });

        permanentUrl = uploadResult.secure_url;
        console.log("[ImageGen] ✅ URL uploaded to Cloudinary:", permanentUrl);
      } catch (uploadErr) {
        console.error("[ImageGen] ❌ Cloudinary upload failed for URL:", uploadErr);
        console.warn("[ImageGen] ⚠️ Using original URL as fallback");
      }
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
          uploadedToCloudinary: permanentUrl !== imageUrl && !imageUrl.includes("cloudinary.com"),
          isBase64: imageUrl.startsWith("data:image"),
        },
      })
      .returning();

    console.log(`[ImageGen] ✅ Saved generation: ${generation.id}`);

    res.status(201).json({ success: true, generation });
  } catch (error) {
    console.error("[ImageGen] ❌ Save error:", error);
    res.status(500).json({ success: false, error: "Failed to save image generation" });
  }
};

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
    res.status(500).json({ success: false, error: "Failed to fetch generations" });
  }
};

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
      return res.status(404).json({ success: false, error: "Generation not found" });
    }

    if (generation.userId !== userId) {
      return res.status(403).json({ success: false, error: "Forbidden" });
    }

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
    res.status(500).json({ success: false, error: "Failed to delete generation" });
  }
};

export const improvePrompt = async (req: Request, res: Response) => {
  try {
    const authUser = (req as any).user;
    const userId = authUser?.id ?? authUser?.userId;

    if (!userId) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    const { prompt, model } = req.body;

    if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
      return res.status(400).json({ success: false, error: "Valid prompt is required" });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ success: false, error: "GEMINI_API_KEY not configured" });
    }

    console.log(`[ImageGen] Improving prompt for model: ${model || 'default'}`);

    const systemPrompt = getSystemPromptForModel(model);
    
    const fullPrompt = `${systemPrompt}

Original prompt: "${prompt}"

Please provide an improved, detailed version of this image generation prompt. Focus on:
- Adding vivid visual details
- Specifying lighting, atmosphere, and mood
- Including artistic style elements
- Enhancing composition suggestions
- Adding color palette descriptions

Return ONLY the improved prompt without any explanations or additional text.`;

    const result = await textModel.generateContent(fullPrompt);
    const response = await result.response;
    const improvedPrompt = response.text().trim()
      .replace(/^["']|["']$/g, '')
      .replace(/^```|```$/g, '')
      .trim();

    console.log(`[ImageGen] Prompt improved successfully`);

    res.json({ success: true, improvedPrompt, originalPrompt: prompt });
  } catch (error: any) {
    console.error("[ImageGen] Improve prompt error:", error);
    res.status(500).json({ success: false, error: error.message || "Failed to improve prompt" });
  }
};

// 🍌 Generate image with Nano Banana (Google Gemini)
export const generateWithNanoBanana = async (req: Request, res: Response) => {
  try {
    const authUser = (req as any).user;
    const userId = authUser?.id ?? authUser?.userId;

    if (!userId) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    const { prompt, model, aspectRatio } = req.body;

    // Validation
    if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
      return res.status(400).json({ success: false, error: "Valid prompt is required" });
    }

    if (!model) {
      return res.status(400).json({ success: false, error: "Model is required" });
    }

    if (!aspectRatio) {
      return res.status(400).json({ success: false, error: "Aspect ratio is required" });
    }

    // Generate image using service
    const result = await nanoBananaService.generateImage({
      prompt: prompt.trim(),
      model,
      aspectRatio,
    });

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error || "Failed to generate image",
      });
    }

    return res.status(200).json({
      success: true,
      imageUrl: result.imageUrl,
    });
  } catch (error: any) {
    console.error("[NanoBanana] Controller error:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to generate image with Nano Banana",
    });
  }
};

// 🧪 Test Nano Banana API connection (Optional)
export const testNanoBananaConnection = async (req: Request, res: Response) => {
  try {
    const authUser = (req as any).user;
    const userId = authUser?.id ?? authUser?.userId;

    if (!userId) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    const results = await nanoBananaService.testApiKeys();
    const status = nanoBananaService.getStatus();

    return res.status(200).json({
      success: true,
      keys: {
        primary: results.primary ? "valid" : "invalid",
        secondary: results.secondary ? "valid" : "invalid",
      },
      status,
    });
  } catch (error: any) {
    console.error("[NanoBanana] Test connection error:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to test API keys",
    });
  }
};