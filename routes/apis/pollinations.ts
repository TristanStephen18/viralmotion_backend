import { Router } from "express";
import axios from "axios";

const router = Router();

const POLLINATIONS_API_KEY = process.env.POLLINATIONS_API_KEY || "";

/**
 * Generate image using Pollinations AI
 * POST /api/pollinations/generate
 */
router.post("/generate", async (req, res) => {
  try {
    const { prompt, width, height, model, seed } = req.body;

    // Validation
    if (!prompt || prompt.trim().length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: "Prompt is required" 
      });
    }

    console.log("[Pollinations] Generating image...", {
      prompt: prompt.substring(0, 50),
      model,
      dimensions: `${width}x${height}`,
      seed,
      hasApiKey: !!POLLINATIONS_API_KEY,
    });

    // Build Pollinations URL
    const encodedPrompt = encodeURIComponent(prompt);
    let imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&model=${model}&nologo=true&enhance=false`;
    
    if (seed) {
      imageUrl += `&seed=${seed}`;
    }

    // ✅ Add API key to URL if available (Pollinations may support this)
    if (POLLINATIONS_API_KEY) {
      imageUrl += `&apikey=${POLLINATIONS_API_KEY}`;
    }

    // Request headers
    const headers: any = {
      "User-Agent": "ViralMotion/1.0",
    };

    // Fetch the image from Pollinations
    const response = await axios.get(imageUrl, {
      headers,
      responseType: "arraybuffer",
      timeout: 60000, // 60 seconds
      maxContentLength: 10 * 1024 * 1024, // 10MB max
    });

    // Convert to base64 for frontend
    const base64Image = Buffer.from(response.data).toString("base64");
    const mimeType = response.headers["content-type"] || "image/png";
    const dataUri = `data:${mimeType};base64,${base64Image}`;

    console.log("[Pollinations] ✅ Image generated successfully");

    res.json({
      success: true,
      imageUrl: dataUri,
      metadata: {
        model,
        dimensions: `${width}x${height}`,
        seed,
      },
    });

  } catch (error: any) {
    console.error("[Pollinations] ❌ Generation error:", error.message);
    
    // Handle specific error cases
    if (error.response?.status === 429) {
      return res.status(429).json({
        success: false,
        error: "Rate limit exceeded. Please try again in a moment.",
      });
    }

    if (error.response?.status === 401 || error.response?.status === 403) {
      return res.status(401).json({
        success: false,
        error: "Invalid API credentials. Please check your Pollinations API key.",
      });
    }

    if (error.code === "ECONNABORTED" || error.code === "ETIMEDOUT") {
      return res.status(504).json({
        success: false,
        error: "Request timed out. The image generation took too long.",
      });
    }

    res.status(500).json({
      success: false,
      error: error.message || "Failed to generate image with Pollinations",
      details: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
});

/**
 * Health check for Pollinations service
 * GET /api/pollinations/health
 */
router.get("/health", async (req, res) => {
  try {
    // Simple test request
    const testUrl = "https://image.pollinations.ai/prompt/test?width=64&height=64&nologo=true";
    
    const response = await axios.get(testUrl, {
      timeout: 5000,
      validateStatus: (status) => status < 500,
    });

    res.json({
      success: true,
      status: "operational",
      responseTime: response.headers["x-response-time"] || "unknown",
      hasApiKey: !!POLLINATIONS_API_KEY,
    });

  } catch (error: any) {
    res.status(503).json({
      success: false,
      status: "degraded",
      error: error.message,
    });
  }
});

export default router;