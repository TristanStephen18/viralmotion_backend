import { GoogleGenerativeAI } from "@google/generative-ai";

interface NanoBananaGenerateRequest {
  prompt: string;
  model: string;
  aspectRatio: string;
}

interface NanoBananaGenerateResponse {
  success: boolean;
  imageUrl?: string;
  error?: string;
}

class NanoBananaService {
  private apiKeys: string[];
  private currentKeyIndex: number = 0;

  constructor() {
    // Load API keys from environment
    const key1 = process.env.GEMINI_API_KEY || "";
    const key2 = process.env.GEMINI_API_KEY_2 || "";

    // Store both keys (filter out empty ones)
    this.apiKeys = [key1, key2].filter((key) => key.length > 0);

    if (this.apiKeys.length === 0) {
      console.warn("⚠️ No GEMINI_API_KEY found in environment variables");
    } else {
      console.log(`✅ Loaded ${this.apiKeys.length} Gemini API key(s) for Nano Banana`);
    }
  }

  /**
   * Get the current API key
   */
  private getCurrentApiKey(): string {
    if (this.apiKeys.length === 0) {
      throw new Error("No Gemini API keys configured");
    }
    return this.apiKeys[this.currentKeyIndex % this.apiKeys.length];
  }

  /**
   * Rotate to the next API key (for fallback on rate limit)
   */
  private rotateApiKey(): void {
    if (this.apiKeys.length > 1) {
      this.currentKeyIndex = (this.currentKeyIndex + 1) % this.apiKeys.length;
      console.log(`🔄 [NanoBanana] Rotated to API key #${this.currentKeyIndex + 1}`);
    }
  }

  /**
   * Convert aspect ratio to dimensions (for logging/metadata)
   */
  private getImageDimensions(aspectRatio: string): { width: number; height: number } {
    switch (aspectRatio) {
      case "9:16":
        return { width: 512, height: 912 };
      case "16:9":
        return { width: 912, height: 512 };
      case "1:1":
        return { width: 1024, height: 1024 };
      case "4:5":
        return { width: 720, height: 900 };
      default:
        return { width: 512, height: 912 };
    }
  }

  /**
   * Validate if the model is supported for image generation
   */
  private isValidModel(model: string): boolean {
    const validModels = [
      "gemini-2.5-flash-image",
      "gemini-2.5-flash-image-preview",
      "gemini-3-pro-image-preview",
      "nano-banana-pro-preview",
    ];
    return validModels.includes(model);
  }

  /**
   * Generate image using a specific API key
   */
  private async generateWithKey(
    apiKey: string,
    prompt: string,
    model: string,
    aspectRatio: string
  ): Promise<string> {
    const genAI = new GoogleGenerativeAI(apiKey);
    const imageModel = genAI.getGenerativeModel({ model });

    const result = await imageModel.generateContent({
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `Generate an image with the following description: ${prompt}. The aspect ratio should be ${aspectRatio}.`,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 1,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 8192,
      },
    });

    const response = await result.response;

    // Check if we have candidates
    if (!response.candidates || response.candidates.length === 0) {
      throw new Error("No image generated from API");
    }

    const candidate = response.candidates[0];

    // Look for inline data (base64 image)
    if (candidate.content?.parts) {
      for (const part of candidate.content.parts) {
        if (part.inlineData?.data) {
          const base64Image = part.inlineData.data;
          const mimeType = part.inlineData.mimeType || "image/png";
          return `data:${mimeType};base64,${base64Image}`;
        }
      }
    }

    // If no inline data found, check if there's text that might contain image info
    const textContent = response.text();
    if (textContent) {
      try {
        const jsonResponse = JSON.parse(textContent);
        if (jsonResponse.image || jsonResponse.imageUrl) {
          return jsonResponse.image || jsonResponse.imageUrl;
        }
      } catch (parseError) {
        // Not JSON, continue to error
      }
    }

    throw new Error("No image data found in response");
  }

  /**
   * Main method to generate image with automatic fallback
   */
  async generateImage(
    params: NanoBananaGenerateRequest
  ): Promise<NanoBananaGenerateResponse> {
    try {
      const { prompt, model, aspectRatio } = params;

      // Validate model
      if (!this.isValidModel(model)) {
        return {
          success: false,
          error: `Invalid model: ${model}. Supported models: gemini-2.5-flash-image, gemini-2.5-flash-image-preview, gemini-3-pro-image-preview, nano-banana-pro-preview`,
        };
      }

      const { width, height } = this.getImageDimensions(aspectRatio);

      console.log(`🍌 [NanoBanana] Generating image with model: ${model}`);
      console.log(`📐 [NanoBanana] Dimensions: ${width}x${height}`);
      console.log(`✏️ [NanoBanana] Prompt: ${prompt.substring(0, 100)}...`);

      // Try with current API key
      try {
        const currentKey = this.getCurrentApiKey();
        const imageUrl = await this.generateWithKey(
          currentKey,
          prompt,
          model,
          aspectRatio
        );

        console.log(`✅ [NanoBanana] Image generated successfully`);

        return {
          success: true,
          imageUrl,
        };
      } catch (primaryError: any) {
        console.error(`❌ [NanoBanana] Primary key failed:`, primaryError.message);

        // If we have a secondary key, try it
        if (this.apiKeys.length > 1) {
          console.log(`🔄 [NanoBanana] Trying fallback API key...`);
          this.rotateApiKey();

          try {
            const fallbackKey = this.getCurrentApiKey();
            const imageUrl = await this.generateWithKey(
              fallbackKey,
              prompt,
              model,
              aspectRatio
            );

            console.log(`✅ [NanoBanana] Image generated with fallback key`);

            return {
              success: true,
              imageUrl,
            };
          } catch (fallbackError: any) {
            console.error(`❌ [NanoBanana] Fallback key also failed:`, fallbackError.message);
            throw fallbackError; // Throw to be caught by outer catch
          }
        }

        // No fallback available, throw the primary error
        throw primaryError;
      }
    } catch (error: any) {
      console.error(`❌ [NanoBanana] Generation error:`, error);

      // Parse error message
      let errorMessage = "Failed to generate image";

      if (error.message?.includes("API key") || error.message?.includes("401")) {
        errorMessage = "Invalid API key. Please check your Gemini API configuration.";
      } else if (
        error.message?.includes("quota") ||
        error.message?.includes("rate limit") ||
        error.message?.includes("429")
      ) {
        errorMessage = "Rate limit exceeded. Please try again in a few moments.";
      } else if (error.message?.includes("model") || error.message?.includes("404")) {
        errorMessage = `Model not available or not supported for image generation.`;
      } else if (error.message) {
        errorMessage = error.message;
      }

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Test if API keys are valid
   */
  async testApiKeys(): Promise<{
    primary: boolean;
    secondary: boolean;
  }> {
    const results = {
      primary: false,
      secondary: false,
    };

    // Test primary key
    if (this.apiKeys.length > 0) {
      try {
        const genAI = new GoogleGenerativeAI(this.apiKeys[0]);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        await model.generateContent("test");
        results.primary = true;
        console.log("✅ [NanoBanana] Primary API key is valid");
      } catch (error) {
        console.error("❌ [NanoBanana] Primary API key is invalid");
      }
    }

    // Test secondary key
    if (this.apiKeys.length > 1) {
      try {
        const genAI = new GoogleGenerativeAI(this.apiKeys[1]);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        await model.generateContent("test");
        results.secondary = true;
        console.log("✅ [NanoBanana] Secondary API key is valid");
      } catch (error) {
        console.error("❌ [NanoBanana] Secondary API key is invalid");
      }
    }

    return results;
  }

  /**
   * Get list of supported models
   */
  getSupportedModels(): string[] {
    return [
      "gemini-2.5-flash-image",
      "gemini-2.5-flash-image-preview",
      "gemini-3-pro-image-preview",
      "nano-banana-pro-preview",
    ];
  }

  /**
   * Get current API key status
   */
  getStatus(): {
    keysConfigured: number;
    currentKeyIndex: number;
    supportedModels: string[];
  } {
    return {
      keysConfigured: this.apiKeys.length,
      currentKeyIndex: this.currentKeyIndex,
      supportedModels: this.getSupportedModels(),
    };
  }
}

export const nanoBananaService = new NanoBananaService();