// //routes/apis/imagegeneration/gemini.ts
// import { GoogleGenAI, PersonGeneration, SafetyFilterLevel } from '@google/genai';
// import { Router } from 'express';
// const router = Router();

// export async function POST(req) {
//   try {
//     const { prompt, width, height } = await req.json();

//     if (!prompt) {
//       return Response.json(
//         { ok: false, error: "Prompt is required" },
//         { status: 400 }
//       );
//     }

//     const ai = new GoogleGenAI({
//       apiKey: process.env.GEMINI_API_KEY_2
//     });

//     // Determine aspect ratio based on dimensions
//     let aspectRatio = "1:1";
//     if (width && height) {
//       const ratio = width / height;
//       if (ratio > 1.5) aspectRatio = "16:9";
//       else if (ratio < 0.7) aspectRatio = "9:16";
//       else if (ratio > 1.1 && ratio < 1.4) aspectRatio = "4:3";
//       else if (ratio > 0.7 && ratio < 0.9) aspectRatio = "3:4";
//     }

//     // Generate image using Imagen 3 or 4
//     const response = await ai.models.generateImages({
//       model: 'imagen-3.0-generate-002', // or 'imagen-4.0-generate-001'
//       prompt: prompt,
//       config: {
//         numberOfImages: 1,
//         aspectRatio: aspectRatio,
//         outputMimeType: 'image/jpeg',
//         includeRaiReason: true,
//         safetyFilterLevel: 'BLOCK_LOW_AND_ABOVE' as SafetyFilterLevel,
//         personGeneration: 'ALLOW_ADULT' as PersonGeneration
//       }
//     });

//     // Extract the generated image
//     const generatedImage = response.generatedImages?.[0];
    
//     if (!generatedImage || !generatedImage.image?.imageBytes) {
//       throw new Error("No image generated");
//     }

//     // Convert base64 image to data URL
//     const imageBase64 = `data:image/jpeg;base64,${generatedImage.image.imageBytes}`;

//     return Response.json({
//       ok: true,
//       image: imageBase64,
//       result: { image: imageBase64 }
//     });

//   } catch (error) {
//     console.error("Gemini generation error:", error);
//     return Response.json(
//       {
//         ok: false,
//         error: error.message || "Failed to generate image with Gemini"
//       },
//       { status: 500 }
//     );
//   }
// }

// router.post('/image-generate', async (req, res) => {
//   try {
//     const { prompt, width, height } = req.body;

//     if (!prompt) {
//       return res.status(400).json({ ok: false, error: "Prompt is required" });
//     }

//     const ai = new GoogleGenAI({
//       apiKey: process.env.GEMINI_API_KEY_2
//     });

//     // Determine aspect ratio
//     let aspectRatio = "1:1";
//     if (width && height) {
//       const ratio = width / height;
//       if (ratio > 1.5) aspectRatio = "16:9";
//       else if (ratio < 0.7) aspectRatio = "9:16";
//       else if (ratio > 1.1 && ratio < 1.4) aspectRatio = "4:3";
//       else if (ratio > 0.7 && ratio < 0.9) aspectRatio = "3:4";
//     }

//     const response = await ai.models.generateImages({
//       model: 'imagen-4.0-generate-001',
//       prompt: prompt,
//       config: {
//         numberOfImages: 1,
//         aspectRatio: aspectRatio,
//         outputMimeType: 'image/jpeg',
//         includeRaiReason: true,
//         safetyFilterLevel: 'BLOCK_LOW_AND_ABOVE' as SafetyFilterLevel,
//         personGeneration: 'ALLOW_ADULT' as PersonGeneration
//       }
//     });

//     const generatedImage = response.generatedImages?.[0];
    
//     if (!generatedImage || !generatedImage.image?.imageBytes) {
//       throw new Error("No image generated");
//     }

//     const imageBase64 = `data:image/jpeg;base64,${generatedImage.image.imageBytes}`;

//     res.json({ ok: true, image: imageBase64 });

//   } catch (error) {
//     console.error("Gemini error:", error);
//     res.status(500).json({ ok: false, error: error.message });
//   }
// });


// export default router;



import { GoogleGenAI, PersonGeneration, SafetyFilterLevel } from '@google/genai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Router } from 'express';

const router = Router();

// Initialize Gemini for text generation (prompt improvement)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const textModel = genAI.getGenerativeModel({ model: "gemini-pro" });

/**
 * Helper function to get system prompt based on model type
 */
function getSystemPromptForModel(modelType?: string): string {
  switch (modelType) {
    case "flux-realism":
      return "You are an expert at creating photorealistic image prompts. Enhance prompts with realistic details, proper lighting (golden hour, soft natural light, etc.), camera settings (depth of field, bokeh), and natural elements.";
    
    case "flux-anime":
      return "You are an expert at creating anime-style image prompts. Enhance prompts with anime aesthetics, character details (expressive eyes, dynamic poses), vibrant colors, cel-shading, and manga/anime art style elements.";
    
    case "turbo":
      return "You are an expert at creating creative and artistic image prompts for the Nano Banana (Turbo) model. This model excels at fast, experimental, and creative outputs. Enhance prompts with imaginative details, unique artistic styles, bold colors, surreal elements, and experimental visual concepts.";
    
    case "imagen-3":
    case "imagen-4":
      return "You are an expert at creating prompts for Google's Imagen model. Enhance prompts with photorealistic details, natural lighting, vivid colors, and precise composition descriptions. Focus on clarity and visual accuracy.";
    
    case "flux":
    default:
      return "You are an expert at creating detailed image generation prompts. Enhance prompts with vivid descriptions, artistic elements, visual details, and creative direction.";
  }
}

/**
 * POST /api/image-generation/gemini/improve-prompt
 * Improve a prompt using Gemini AI
 */
router.post('/improve-prompt', async (req, res) => {
  try {
    const { prompt, model } = req.body;

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Valid prompt is required'
      });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        success: false,
        error: 'GEMINI_API_KEY not configured'
      });
    }

    console.log(`[Gemini] Improving prompt for model: ${model || 'default'}`);

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

    console.log(`[Gemini] Prompt improved successfully`);

    res.json({
      success: true,
      improvedPrompt,
      originalPrompt: prompt
    });

  } catch (error) {
    console.error('[Gemini] Improve prompt error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to improve prompt'
    });
  }
});

/**
 * POST /api/image-generation/gemini/image-generate
 * Generate image using Gemini Imagen API
 */
router.post('/image-generate', async (req, res) => {
  try {
    const { prompt, width, height, model } = req.body;

    if (!prompt) {
      return res.status(400).json({ ok: false, error: "Prompt is required" });
    }

    if (!process.env.GEMINI_API_KEY_2) {
      return res.status(500).json({
        ok: false,
        error: 'GEMINI_API_KEY_2 not configured'
      });
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

    // Choose Imagen model (default to Imagen 4)
    const imagenModel = model === 'imagen-3' 
      ? 'imagen-3.0-generate-002' 
      : 'imagen-4.0-generate-001';

    console.log(`[Gemini] Generating image with ${imagenModel}, aspect ratio: ${aspectRatio}`);

    const response = await ai.models.generateImages({
      model: imagenModel,
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

    console.log(`[Gemini] Image generated successfully`);

    res.json({ 
      ok: true, 
      success: true,
      image: imageBase64,
      model: imagenModel,
      aspectRatio
    });

  } catch (error) {
    console.error("[Gemini] Image generation error:", error);
    res.status(500).json({ 
      ok: false, 
      success: false,
      error: error.message || "Failed to generate image with Gemini"
    });
  }
});

export default router;