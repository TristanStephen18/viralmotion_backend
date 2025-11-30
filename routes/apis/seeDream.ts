import express from "express";
import { z } from "zod";
import seeDreamClient from "../../services/seeDreamClient.ts";
import type { GenerateRequest } from "../../types/seeDream.ts";

const router = express.Router();

const bodySchema = z.object({
  prompt: z.string().min(1),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  steps: z.number().int().positive().optional(),
  n: z.number().int().positive().optional(),
});

router.post("/generate", async (req, res, next) => {
  try {
    const parsed = bodySchema.parse(req.body);
    
    // Using OpenAI-compatible format with CORRECT model name
    const payload: GenerateRequest = {
      model: "seedream-4-0-250828", // ✅ FIXED: Correct Seedream 4.0 model name
      prompt: parsed.prompt,
      size: parsed.width && parsed.height 
        ? `${parsed.width}x${parsed.height}` 
        : "1024x1024",
      n: parsed.n || 1,
      response_format: "url",
    };

    console.log("Sending payload to Seedream:", payload);
    const result = await seeDreamClient.generate(payload);
    res.json({ ok: true, result: result.raw });
  } catch (err: any) {
    console.error("Route error:", err);
    console.error("Error details:", err?.details);
    next(err);
  }
});

export default router;