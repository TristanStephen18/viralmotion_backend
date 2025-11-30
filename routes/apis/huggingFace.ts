import express from "express";
import { z } from "zod";
import huggingFaceClient from "../../services/HhuggingFaceClient.ts";
import type { HuggingFaceGenerateRequest } from "../../types/huggingFace.ts";

const router = express.Router();

const bodySchema = z.object({
  prompt: z.string().min(1),
  negative_prompt: z.string().optional(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  steps: z.number().int().positive().optional(),
  guidance_scale: z.number().positive().optional(),
  model: z.string().optional(),
});

// Updated list of models that still work on free tier
router.get("/models", (req, res) => {
  res.json({
    models: [
      {
        id: "stabilityai/stable-diffusion-xl-base-1.0",
        name: "Stable Diffusion XL (RECOMMENDED)",
        description: "Still working on free tier",
        status: "✅ Active"
      },
      {
        id: "runwayml/stable-diffusion-v1-5",
        name: "Stable Diffusion v1.5",
        description: "Classic model, may work",
        status: "⚠️ Limited"
      },
      {
        id: "CompVis/stable-diffusion-v1-4",
        name: "Stable Diffusion v1.4",
        description: "Older model, may work",
        status: "⚠️ Limited"
      },
    ],
    note: "Many HF models are no longer available on free tier. Consider using Pollinations (free, no API key) instead."
  });
});

router.post("/generate", async (req, res, next) => {
  try {
    const parsed = bodySchema.parse(req.body);

    // Use SDXL by default as it's most likely to work
    const modelToUse = parsed.model || "stabilityai/stable-diffusion-xl-base-1.0";
    huggingFaceClient.setModel(modelToUse);

    const payload = {
      inputs: parsed.prompt,
      parameters: {
        negative_prompt: parsed.negative_prompt,
        num_inference_steps: parsed.steps || 30,
        guidance_scale: parsed.guidance_scale || 7.5,
        // Note: SDXL doesn't always respect width/height in free tier
        width: parsed.width || 1024,
        height: parsed.height || 1024,
      },
    };

    console.log("Sending to Hugging Face:", payload);
    const result = await huggingFaceClient.generate(payload);

    // If model is loading, return 202 with retry info
    if (result.error && result.estimated_time) {
      return res.status(202).json({
        ok: false,
        message: result.error,
        estimated_time: result.estimated_time,
        retry_after: result.estimated_time,
      });
    }

    res.json({
      ok: true,
      image: result.image,
      model: huggingFaceClient.getModel(),
    });
  } catch (err: any) {
    console.error("HuggingFace route error:", err);
    
    res.status(err.status || 500).json({
      ok: false,
      error: err.message || "Image generation failed",
      suggestion: "Try using Pollinations instead - it's free and requires no API key!"
    });
  }
});

export default router;