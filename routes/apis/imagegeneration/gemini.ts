import { GoogleGenAI, PersonGeneration, SafetyFilterLevel } from '@google/genai';
import { Router } from 'express';
const router = Router();

export async function POST(req) {
  try {
    const { prompt, width, height } = await req.json();

    if (!prompt) {
      return Response.json(
        { ok: false, error: "Prompt is required" },
        { status: 400 }
      );
    }

    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY_2
    });

    // Determine aspect ratio based on dimensions
    let aspectRatio = "1:1";
    if (width && height) {
      const ratio = width / height;
      if (ratio > 1.5) aspectRatio = "16:9";
      else if (ratio < 0.7) aspectRatio = "9:16";
      else if (ratio > 1.1 && ratio < 1.4) aspectRatio = "4:3";
      else if (ratio > 0.7 && ratio < 0.9) aspectRatio = "3:4";
    }

    // Generate image using Imagen 3 or 4
    const response = await ai.models.generateImages({
      model: 'imagen-3.0-generate-002', // or 'imagen-4.0-generate-001'
      prompt: prompt,
      config: {
        numberOfImages: 1,
        aspectRatio: aspectRatio,
        outputMimeType: 'image/jpeg',
        includeRaiReason: true,
        safetyFilterLevel: 'BLOCK_LOW_AND_ABOVE' as SafetyFilterLevel,
        personGeneration: 'ALLOW_ADULT' as PersonGeneration
      }
    });

    // Extract the generated image
    const generatedImage = response.generatedImages?.[0];
    
    if (!generatedImage || !generatedImage.image?.imageBytes) {
      throw new Error("No image generated");
    }

    // Convert base64 image to data URL
    const imageBase64 = `data:image/jpeg;base64,${generatedImage.image.imageBytes}`;

    return Response.json({
      ok: true,
      image: imageBase64,
      result: { image: imageBase64 }
    });

  } catch (error) {
    console.error("Gemini generation error:", error);
    return Response.json(
      {
        ok: false,
        error: error.message || "Failed to generate image with Gemini"
      },
      { status: 500 }
    );
  }
}

router.post('/image-generate', async (req, res) => {
  try {
    const { prompt, width, height } = req.body;

    if (!prompt) {
      return res.status(400).json({ ok: false, error: "Prompt is required" });
    }

    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY_2
    });

    // Determine aspect ratio
    let aspectRatio = "1:1";
    if (width && height) {
      const ratio = width / height;
      if (ratio > 1.5) aspectRatio = "16:9";
      else if (ratio < 0.7) aspectRatio = "9:16";
      else if (ratio > 1.1 && ratio < 1.4) aspectRatio = "4:3";
      else if (ratio > 0.7 && ratio < 0.9) aspectRatio = "3:4";
    }

    const response = await ai.models.generateImages({
      model: 'imagen-4.0-generate-001',
      prompt: prompt,
      config: {
        numberOfImages: 1,
        aspectRatio: aspectRatio,
        outputMimeType: 'image/jpeg',
        includeRaiReason: true,
        safetyFilterLevel: 'BLOCK_LOW_AND_ABOVE' as SafetyFilterLevel,
        personGeneration: 'ALLOW_ADULT' as PersonGeneration
      }
    });

    const generatedImage = response.generatedImages?.[0];
    
    if (!generatedImage || !generatedImage.image?.imageBytes) {
      throw new Error("No image generated");
    }

    const imageBase64 = `data:image/jpeg;base64,${generatedImage.image.imageBytes}`;

    res.json({ ok: true, image: imageBase64 });

  } catch (error) {
    console.error("Gemini error:", error);
    res.status(500).json({ ok: false, error: error.message });
  }
});


export default router;