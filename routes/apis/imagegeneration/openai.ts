import OpenAI from 'openai';
import type { OpenAiCanvasSize } from '../../../types/openaisize.ts';
import { Router } from 'express';

const router = Router();

export async function POST(req) {
  try {
    const { prompt, size = "1024x1024", model = "dall-e-3" } = await req.json();

    if (!prompt) {
      return Response.json(
        { ok: false, error: "Prompt is required" },
        { status: 400 }
      );
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    // DALL-E 3 only supports specific sizes
    const validSizes = ["1024x1024", "1024x1792", "1792x1024"];
    let finalSize = "1024x1024";

    // Map requested size to closest valid size
    if (size.includes("x")) {
      const [w, h] = size.split("x").map(Number);
      if (w > h) {
        finalSize = "1792x1024"; // landscape
      } else if (h > w) {
        finalSize = "1024x1792"; // portrait
      } else {
        finalSize = "1024x1024"; // square
      }
    }

    const response = await openai.images.generate({
      model: model,
      prompt: prompt,
      n: 1,
      size: finalSize as OpenAiCanvasSize,
      quality: "standard", // or "hd" for better quality
      response_format: "url" // or "b64_json" for base64
    });

    return Response.json({
      ok: true,
      image: response.data[0].url,
      result: response
    });

  } catch (error) {
    console.error("OpenAI generation error:", error);
    return Response.json(
      {
        ok: false,
        error: error.message || "Failed to generate image with OpenAI",
        message: error.message
      },
      { status: 500 }
    );
  }
}

router.post('/image-generate',async (req, res) => {
  try {
    const { prompt, size = "1024x1024" } = req.body;

    if (!prompt) {
      return res.status(400).json({ ok: false, error: "Prompt is required" });
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const [w, h] = size.split("x").map(Number);
    let finalSize = "1024x1024";
    if (w > h) finalSize = "1792x1024";
    else if (h > w) finalSize = "1024x1792";

    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: prompt,
      n: 1,
      size: finalSize as OpenAiCanvasSize,
      quality: "standard"
    });

    res.json({ ok: true, image: response.data[0].url, result: response });

  } catch (error) {
    console.error("OpenAI error:", error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

export default router;