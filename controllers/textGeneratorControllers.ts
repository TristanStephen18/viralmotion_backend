// // src/controllers/textGeneratorController.ts

// import type { Request, Response } from "express";
// import OpenAI from "openai";
// import { GoogleGenerativeAI } from "@google/generative-ai";

// // Initialize OpenAI
// const openai = new OpenAI({
//   apiKey: process.env.OPENAI_API_KEY,
// });

// // Initialize Gemini
// const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// // Types and Interfaces
// interface GenerateTextRequest {
//   topic: string;
//   contentType: "tiktok-script" | "youtube-script" | "instagram-caption" | "video-hook" | "viral-idea" | "video-cta";
//   tone: "energetic" | "casual" | "professional" | "funny" | "inspiring" | "storytelling";
//   length: "short" | "medium" | "long" | "vlog";
//   additionalContext?: string;
// }

// interface ContentTypeConfig {
//   instruction: string;
//   structure: string;
//   style: string;
//   platform: string;
// }

// interface LengthConfig {
//   words: number;
//   tokens: number;
//   description: string;
//   duration: string;
// }

// // Map content types to video-optimized prompts
// const CONTENT_TYPE_PROMPTS: Record<string, ContentTypeConfig> = {
//   "tiktok-script": {
//     instruction: "Write a viral TikTok video script",
//     structure: "Start with a STRONG HOOK (first 3 seconds). Include engaging visuals descriptions, transitions, text overlay suggestions. End with a clear CTA (like, follow, share). Keep it fast-paced and attention-grabbing.",
//     style: "Use short, punchy sentences. Add B-roll suggestions. Include trending sounds/effects notes. Make it scroll-stopping.",
//     platform: "TikTok",
//   },
//   "youtube-script": {
//     instruction: "Write a comprehensive YouTube video script",
//     structure: "Include: INTRO (hook + intro animation), MAIN CONTENT (with timestamps and B-roll notes), TRANSITIONS between sections, OUTRO (CTA + end screen elements). Add [VISUAL CUES] throughout.",
//     style: "Conversational yet informative. Include moments for engagement (questions, polls). Note where to add graphics/animations. Include retention hooks every 2-3 minutes.",
//     platform: "YouTube",
//   },
//   "instagram-caption": {
//     instruction: "Create an engaging Instagram caption",
//     structure: "Hook in first line (emoji + attention grabber). Main message (2-3 paragraphs max). Clear CTA. Strategic line breaks. End with 15-25 relevant hashtags in groups.",
//     style: "Authentic and relatable. Use emojis naturally. Ask questions to boost engagement. Include story-telling when relevant.",
//     platform: "Instagram",
//   },
//   "video-hook": {
//     instruction: "Write attention-grabbing video hooks (first 3 seconds)",
//     structure: "Create 3-5 different hook variations. Each should: Stop the scroll, Create curiosity, Promise value. Include both visual and verbal elements.",
//     style: "Pattern interrupts work best. Use: Questions, bold statements, relatable scenarios, curiosity gaps, or shocking facts.",
//     platform: "All Platforms",
//   },
//   "viral-idea": {
//     instruction: "Generate viral video content ideas",
//     structure: "Provide 3-5 unique video concepts. For each: Hook concept, Main angle, Key talking points, Why it will go viral, Platform recommendation.",
//     style: "Focus on trending topics, relatable pain points, entertaining angles, or educational value. Consider what makes people SHARE.",
//     platform: "Multi-Platform",
//   },
//   "video-cta": {
//     instruction: "Write compelling video call-to-actions",
//     structure: "Create 3-5 CTA variations. Include: What to do (subscribe/like/share/comment), Why they should do it, How it benefits them. Vary the approach.",
//     style: "Natural and authentic, not salesy. Use: Reciprocity, community building, exclusive benefits, or genuine connection.",
//     platform: "All Platforms",
//   },
// };

// // Video-specific length settings
// const LENGTH_SETTINGS: Record<string, LengthConfig> = {
//   short: { words: 50, tokens: 200, description: "15-30 seconds", duration: "15-30s" },
//   medium: { words: 100, tokens: 350, description: "60 seconds", duration: "60s" },
//   long: { words: 300, tokens: 800, description: "3-5 minutes", duration: "3-5min" },
//   vlog: { words: 800, tokens: 2000, description: "10+ minutes", duration: "10+min" },
// };

// // Video-optimized tone descriptions
// const TONE_DESCRIPTIONS: Record<string, string> = {
//   energetic: "high-energy, enthusiastic, and exciting - perfect for hype content",
//   casual: "relaxed, authentic, and conversational - like talking to a friend",
//   professional: "polished, credible, and authoritative - expert positioning",
//   funny: "humorous, entertaining, and playful - meme-worthy content",
//   inspiring: "motivational, uplifting, and empowering - transformation stories",
//   storytelling: "narrative-driven, engaging, and emotional - deep connection",
// };

// /**
//  * Generate content using OpenAI
//  */
// async function generateWithOpenAI(
//   systemPrompt: string,
//   userPrompt: string,
//   maxTokens: number
// ): Promise<string> {
//   const completion = await openai.chat.completions.create({
//     model: "gpt-4o-mini",
//     messages: [
//       { role: "system", content: systemPrompt },
//       { role: "user", content: userPrompt },
//     ],
//     max_tokens: maxTokens,
//     temperature: 0.8, // Higher for more creative video content
//     top_p: 0.95,
//     frequency_penalty: 0.3,
//     presence_penalty: 0.4, // Encourage variety
//   });

//   const content = completion.choices[0].message.content?.trim();
//   if (!content) {
//     throw new Error("No content generated from OpenAI");
//   }

//   return content;
// }

// /**
//  * Generate content using Gemini (fallback)
//  */
// async function generateWithGemini(
//   systemPrompt: string,
//   userPrompt: string
// ): Promise<string> {
//   // Use gemini-2.5-flash (stable and available)
//   const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

//   const prompt = `${systemPrompt}

// ${userPrompt}`;

//   const result = await model.generateContent(prompt);
//   const response = await result.response;
//   const content = response.text().trim();

//   if (!content) {
//     throw new Error("No content generated from Gemini");
//   }

//   return content;
// }

// /**
//  * Generate AI text content for video/social media
//  * POST /api/generate-text
//  */
// export const generateText = async (
//   req: Request<{}, {}, GenerateTextRequest>,
//   res: Response
// ): Promise<Response> => {
//   try {
//     const { topic, contentType, tone, length, additionalContext } = req.body;

//     // Validation
//     if (!topic || !contentType || !tone || !length) {
//       return res.status(400).json({
//         error: "Missing required fields: topic, contentType, tone, length",
//       });
//     }

//     if (topic.length < 5) {
//       return res.status(400).json({
//         error: "Topic must be at least 5 characters long",
//       });
//     }

//     if (topic.length > 500) {
//       return res.status(400).json({
//         error: "Topic must be less than 500 characters",
//       });
//     }

//     // Get content type settings
//     const contentTypeConfig = CONTENT_TYPE_PROMPTS[contentType];
//     if (!contentTypeConfig) {
//       return res.status(400).json({
//         error: `Invalid content type: ${contentType}`,
//       });
//     }

//     // Get length settings
//     const lengthConfig = LENGTH_SETTINGS[length];
//     if (!lengthConfig) {
//       return res.status(400).json({
//         error: `Invalid length: ${length}`,
//       });
//     }

//     // Get tone description
//     const toneDescription = TONE_DESCRIPTIONS[tone];
//     if (!toneDescription) {
//       return res.status(400).json({
//         error: `Invalid tone: ${tone}`,
//       });
//     }

//     // Build the video-optimized prompt
//     const systemPrompt = `You are an expert video content creator and scriptwriter specializing in viral social media content. You understand platform algorithms, audience psychology, and what makes content shareable. Your content is ${toneDescription}.

// Key principles:
// - Hook within 3 seconds
// - Visual storytelling
// - Clear value proposition
// - Strong CTAs
// - Platform-specific optimization`;

//     const userPrompt = `
// ${contentTypeConfig.instruction} about: ${topic}

// Platform: ${contentTypeConfig.platform}
// Duration: ${lengthConfig.duration} (approximately ${lengthConfig.words} words)
// Tone: ${toneDescription}

// Requirements:
// - ${contentTypeConfig.structure}
// - ${contentTypeConfig.style}
// ${additionalContext ? `\nAdditional Requirements: ${additionalContext}` : ""}

// CRITICAL RULES:
// - Start with a HOOK that stops the scroll
// - Write for ${lengthConfig.duration} video length
// - Include visual descriptions in [BRACKETS]
// - Use emojis naturally where appropriate
// - End with relevant hashtags (15-25 hashtags in groups)
// - Make it platform-optimized for ${contentTypeConfig.platform}
// - Sound natural when spoken aloud
// - Include engagement elements (questions, CTAs)

// Format the output clearly with sections when appropriate.

// Create the content now:
// `.trim();

//     console.log(`🎬 Generating ${contentType} content...`);
//     console.log(`📝 Topic: ${topic}`);
//     console.log(`🎨 Tone: ${tone}, Duration: ${lengthConfig.duration}`);

//     let generatedContent: string;
//     let usedProvider: string;

//     // Try OpenAI first
//     try {
//       console.log("🔵 Attempting generation with OpenAI...");
//       generatedContent = await generateWithOpenAI(
//         systemPrompt,
//         userPrompt,
//         lengthConfig.tokens
//       );
//       usedProvider = "OpenAI";
//       console.log("✅ OpenAI generation successful");
//     } catch (openaiError: any) {
//       console.warn("⚠️ OpenAI failed:", openaiError.message);
//       console.log("🟢 Falling back to Gemini...");

//       // Fallback to Gemini
//       try {
//         generatedContent = await generateWithGemini(systemPrompt, userPrompt);
//         usedProvider = "Gemini";
//         console.log("✅ Gemini generation successful (fallback)");
//       } catch (geminiError: any) {
//         console.error("❌ Both OpenAI and Gemini failed");
//         console.error("OpenAI error:", openaiError.message);
//         console.error("Gemini error:", geminiError.message);

//         // Both failed - return error
//         return res.status(500).json({
//           error: "Failed to generate content. Please try again.",
//         });
//       }
//     }

//     console.log(
//       `✅ Content generated with ${usedProvider} (${generatedContent.split(" ").length} words)`
//     );

//     // Return the generated content
//     return res.status(200).json({
//       success: true,
//       content: generatedContent,
//       provider: usedProvider,
//       metadata: {
//         contentType,
//         tone,
//         length,
//         duration: lengthConfig.duration,
//         platform: contentTypeConfig.platform,
//         wordCount: generatedContent.split(" ").length,
//         characterCount: generatedContent.length,
//       },
//     });
//   } catch (error: any) {
//     console.error("❌ Error generating text:", error);

//     // Generic error response
//     return res.status(500).json({
//       error: error.message || "Failed to generate content. Please try again.",
//     });
//   }
// };


// src/controllers/textGeneratorController.ts

import type { Request, Response } from "express";
import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// Types and Interfaces
interface GenerateTextRequest {
  topic: string;
  contentType: "tiktok-script" | "youtube-script" | "instagram-caption" | "video-hook" | "viral-idea" | "video-cta";
  tone: "energetic" | "casual" | "professional" | "funny" | "inspiring" | "storytelling";
  length: "short" | "medium" | "long" | "vlog";
  additionalContext?: string;
}

interface ContentTypeConfig {
  instruction: string;
  structure: string;
  style: string;
  platform: string;
}

interface LengthConfig {
  words: number;
  tokens: number;
  description: string;
  duration: string;
}

// Map content types to video-optimized prompts
const CONTENT_TYPE_PROMPTS: Record<string, ContentTypeConfig> = {
  "tiktok-script": {
    instruction: "Write a viral TikTok video script",
    structure: "Start with a STRONG HOOK (first 3 seconds). Include engaging visuals descriptions, transitions, text overlay suggestions. End with a clear CTA (like, follow, share). Keep it fast-paced and attention-grabbing.",
    style: "Use short, punchy sentences. Add B-roll suggestions. Include trending sounds/effects notes. Make it scroll-stopping.",
    platform: "TikTok",
  },
  "youtube-script": {
    instruction: "Write a comprehensive YouTube video script",
    structure: "Include: INTRO (hook + intro animation), MAIN CONTENT (with timestamps and B-roll notes), TRANSITIONS between sections, OUTRO (CTA + end screen elements). Add [VISUAL CUES] throughout.",
    style: "Conversational yet informative. Include moments for engagement (questions, polls). Note where to add graphics/animations. Include retention hooks every 2-3 minutes.",
    platform: "YouTube",
  },
  "instagram-caption": {
    instruction: "Create an engaging Instagram caption",
    structure: "Hook in first line (emoji + attention grabber). Main message (2-3 paragraphs max). Clear CTA. Strategic line breaks. End with 15-25 relevant hashtags in groups.",
    style: "Authentic and relatable. Use emojis naturally. Ask questions to boost engagement. Include story-telling when relevant.",
    platform: "Instagram",
  },
  "video-hook": {
    instruction: "Write attention-grabbing video hooks (first 3 seconds)",
    structure: "Create 3-5 different hook variations. Each should: Stop the scroll, Create curiosity, Promise value. Include both visual and verbal elements.",
    style: "Pattern interrupts work best. Use: Questions, bold statements, relatable scenarios, curiosity gaps, or shocking facts.",
    platform: "All Platforms",
  },
  "viral-idea": {
    instruction: "Generate viral video content ideas",
    structure: "Provide 3-5 unique video concepts. For each: Hook concept, Main angle, Key talking points, Why it will go viral, Platform recommendation.",
    style: "Focus on trending topics, relatable pain points, entertaining angles, or educational value. Consider what makes people SHARE.",
    platform: "Multi-Platform",
  },
  "video-cta": {
    instruction: "Write compelling video call-to-actions",
    structure: "Create 3-5 CTA variations. Include: What to do (subscribe/like/share/comment), Why they should do it, How it benefits them. Vary the approach.",
    style: "Natural and authentic, not salesy. Use: Reciprocity, community building, exclusive benefits, or genuine connection.",
    platform: "All Platforms",
  },
};

// Video-specific length settings
const LENGTH_SETTINGS: Record<string, LengthConfig> = {
  short: { words: 50, tokens: 200, description: "15-30 seconds", duration: "15-30s" },
  medium: { words: 100, tokens: 350, description: "60 seconds", duration: "60s" },
  long: { words: 300, tokens: 800, description: "3-5 minutes", duration: "3-5min" },
  vlog: { words: 800, tokens: 2000, description: "10+ minutes", duration: "10+min" },
};

// Video-optimized tone descriptions
const TONE_DESCRIPTIONS: Record<string, string> = {
  energetic: "high-energy, enthusiastic, and exciting - perfect for hype content",
  casual: "relaxed, authentic, and conversational - like talking to a friend",
  professional: "polished, credible, and authoritative - expert positioning",
  funny: "humorous, entertaining, and playful - meme-worthy content",
  inspiring: "motivational, uplifting, and empowering - transformation stories",
  storytelling: "narrative-driven, engaging, and emotional - deep connection",
};

/**
 * Generate content using OpenAI
 */
async function generateWithOpenAI(
  systemPrompt: string,
  userPrompt: string,
  maxTokens: number
): Promise<string> {
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    max_tokens: maxTokens,
    temperature: 0.8, // Higher for more creative video content
    top_p: 0.95,
    frequency_penalty: 0.3,
    presence_penalty: 0.4, // Encourage variety
  });

  const content = completion.choices[0].message.content?.trim();
  if (!content) {
    throw new Error("No content generated from OpenAI");
  }

  return content;
}

/**
 * Generate content using Gemini (fallback)
 */
async function generateWithGemini(
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  // Use gemini-2.5-flash (stable and available)
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const prompt = `${systemPrompt}

${userPrompt}`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const content = response.text().trim();

  if (!content) {
    throw new Error("No content generated from Gemini");
  }

  return content;
}

/**
 * Generate AI text content for video/social media
 * POST /api/generate-text
 */
export const generateText = async (
  req: Request<{}, {}, GenerateTextRequest>,
  res: Response
): Promise<Response> => {
  try {
    const { topic, contentType, tone, length, additionalContext } = req.body;

    // Validation
    if (!topic || !contentType || !tone || !length) {
      return res.status(400).json({
        error: "Missing required fields: topic, contentType, tone, length",
      });
    }

    if (topic.length < 5) {
      return res.status(400).json({
        error: "Topic must be at least 5 characters long",
      });
    }

    if (topic.length > 500) {
      return res.status(400).json({
        error: "Topic must be less than 500 characters",
      });
    }

    // Get content type settings
    const contentTypeConfig = CONTENT_TYPE_PROMPTS[contentType];
    if (!contentTypeConfig) {
      return res.status(400).json({
        error: `Invalid content type: ${contentType}`,
      });
    }

    // Get length settings
    const lengthConfig = LENGTH_SETTINGS[length];
    if (!lengthConfig) {
      return res.status(400).json({
        error: `Invalid length: ${length}`,
      });
    }

    // Get tone description
    const toneDescription = TONE_DESCRIPTIONS[tone];
    if (!toneDescription) {
      return res.status(400).json({
        error: `Invalid tone: ${tone}`,
      });
    }

    // Build the video-optimized prompt
    const systemPrompt = `You are an expert video content creator and scriptwriter specializing in viral social media content. You understand platform algorithms, audience psychology, and what makes content shareable. Your content is ${toneDescription}.

Key principles:
- Hook within 3 seconds
- Visual storytelling
- Clear value proposition
- Strong CTAs
- Platform-specific optimization`;

    const userPrompt = `
${contentTypeConfig.instruction} about: ${topic}

Platform: ${contentTypeConfig.platform}
Duration: ${lengthConfig.duration} (approximately ${lengthConfig.words} words)
Tone: ${toneDescription}

Requirements:
- ${contentTypeConfig.structure}
- ${contentTypeConfig.style}
${additionalContext ? `\nAdditional Requirements: ${additionalContext}` : ""}

CRITICAL RULES:
- Start with a HOOK that stops the scroll
- Write for ${lengthConfig.duration} video length
- Include visual descriptions in [BRACKETS]
- Use emojis naturally where appropriate
- End with relevant hashtags (15-25 hashtags in groups)
- Make it platform-optimized for ${contentTypeConfig.platform}
- Sound natural when spoken aloud
- Include engagement elements (questions, CTAs)

Format the output clearly with sections when appropriate.

Create the content now:
`.trim();

    console.log(`🎬 Generating ${contentType} content...`);
    console.log(`📝 Topic: ${topic}`);
    console.log(`🎨 Tone: ${tone}, Duration: ${lengthConfig.duration}`);

    let generatedContent: string;
    let usedProvider: string;

    // Try OpenAI first
    try {
      console.log("🔵 Attempting generation with OpenAI...");
      generatedContent = await generateWithOpenAI(
        systemPrompt,
        userPrompt,
        lengthConfig.tokens
      );
      usedProvider = "OpenAI";
      console.log("✅ OpenAI generation successful");
    } catch (openaiError: any) {
      console.warn("⚠️ OpenAI failed:", openaiError.message);
      console.log("🟢 Falling back to Gemini...");

      // Fallback to Gemini
      try {
        generatedContent = await generateWithGemini(systemPrompt, userPrompt);
        usedProvider = "Gemini";
        console.log("✅ Gemini generation successful (fallback)");
      } catch (geminiError: any) {
        console.error("❌ Both OpenAI and Gemini failed");
        console.error("OpenAI error:", openaiError.message);
        console.error("Gemini error:", geminiError.message);

        // Both failed - return error
        return res.status(500).json({
          error: "Failed to generate content. Please try again.",
        });
      }
    }

    console.log(
      `✅ Content generated with ${usedProvider} (${generatedContent.split(" ").length} words)`
    );

    // Return the generated content
    return res.status(200).json({
      success: true,
      content: generatedContent,
      provider: usedProvider,
      metadata: {
        contentType,
        tone,
        length,
        duration: lengthConfig.duration,
        platform: contentTypeConfig.platform,
        wordCount: generatedContent.split(" ").length,
        characterCount: generatedContent.length,
      },
    });
  } catch (error: any) {
    console.error("❌ Error generating text:", error);

    // Generic error response
    return res.status(500).json({
      error: error.message || "Failed to generate content. Please try again.",
    });
  }
};