import type { Request, Response } from "express";
import axios from "axios";

/**
 * Improve prompt using Gemini AI
 * POST /api/prompt-improvement/improve
 */
export const improvePrompt = async (req: Request, res: Response) => {
  try {
    const authUser = (req as any).user;
    const userId = authUser?.id ?? authUser?.userId;

    if (!userId) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    const { prompt, type } = req.body; // type: 'image' or 'video'

    if (!prompt || prompt.trim().length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: "Prompt is required" 
      });
    }

    const improvementType = type === 'video' ? 'video' : 'image';
    
    const systemPrompt = improvementType === 'video' 
      ? `You are an expert at writing video generation prompts. Improve the following prompt to be more detailed, specific, and effective for AI video generation. Include details about camera movement, lighting, scene composition, mood, and visual style. Keep it concise but descriptive (max 150 words). Return ONLY the improved prompt, nothing else.`
      : `You are an expert at writing image generation prompts. Improve the following prompt to be more detailed, specific, and effective for AI image generation. Include details about style, composition, lighting, colors, and atmosphere. Keep it concise but descriptive (max 100 words). Return ONLY the improved prompt, nothing else.`;

    console.log(`[PromptImprovement] Improving ${improvementType} prompt for user ${userId}`);

    // ✅ Use Gemini REST API directly
    const apiKey = process.env.GEMINI_API_KEY;
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`;

    const requestBody = {
      contents: [
        {
          parts: [
            {
              text: `${systemPrompt}\n\nOriginal prompt: ${prompt.trim()}`
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 500,
      }
    };

    const response = await axios.post(geminiUrl, requestBody, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.data?.candidates?.[0]?.content?.parts?.[0]?.text) {
      throw new Error("No response from Gemini API");
    }

    const improvedPrompt = response.data.candidates[0].content.parts[0].text.trim();

    console.log(`[PromptImprovement] ✅ Successfully improved ${improvementType} prompt`);

    res.json({
      success: true,
      originalPrompt: prompt.trim(),
      improvedPrompt,
    });
  } catch (error) {
    console.error("[PromptImprovement] ❌ Error:", error);
    
    // More detailed error logging
    if (axios.isAxiosError(error)) {
      console.error("[PromptImprovement] Gemini API Error:", error.response?.data);
    }
    
    res.status(500).json({
      success: false,
      error: "Failed to improve prompt",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
};