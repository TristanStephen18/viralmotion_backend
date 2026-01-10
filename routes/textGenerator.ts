// src/routes/textGenerator.ts

import { Router } from "express";
import { generateText } from "../controllers/textGeneratorControllers.ts"; // ← Fixed!

const router = Router();

/**
 * @route   POST /api/generate-text
 * @desc    Generate AI-powered text content
 * @access  Public (add authentication middleware if needed)
 * 
 * @body {
 *   topic: string (required, 5-500 chars) - The topic/description
 *   contentType: "blog" | "social" | "email" | "product" | "ad" | "story" (required)
 *   tone: "professional" | "casual" | "friendly" | "formal" | "enthusiastic" | "persuasive" (required)
 *   length: "short" | "medium" | "long" (required)
 *   additionalContext?: string (optional, max 300 chars) - Additional requirements
 * }
 * 
 * @returns {
 *   success: boolean,
 *   content: string,
 *   metadata: {
 *     contentType: string,
 *     tone: string,
 *     length: string,
 *     wordCount: number,
 *     characterCount: number
 *   }
 * }
 */
router.post("/api/generate-text", generateText);

export default router;