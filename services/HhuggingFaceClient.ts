import axios from "axios";
import type { AxiosInstance } from "axios";

const API_KEY = process.env.HUGGINGFACE_API_KEY;
const BASE_URL = " https://router.huggingface.co/models";

if (!API_KEY) {
  console.warn("Warning: HUGGINGFACE_API_KEY is not set. Set it in your .env");
}

interface HuggingFaceGenerateRequest {
  inputs: string;
  parameters?: {
    negative_prompt?: string;
    num_inference_steps?: number;
    guidance_scale?: number;
    width?: number;
    height?: number;
  };
  options?: {
    wait_for_model?: boolean;
    use_cache?: boolean;
  };
}

interface HuggingFaceGenerateResponse {
  image?: string; // base64 encoded image
  error?: string;
  estimated_time?: number;
}

class HuggingFaceClient {
  private client: AxiosInstance;
  // Default to SDXL as it's the most reliable free model
  private model: string = "stabilityai/stable-diffusion-xl-base-1.0";

  constructor(model?: string) {
    if (model) this.model = model;
    
    this.client = axios.create({
      timeout: 120_000, // 2 minutes for image generation
      headers: {
        "Authorization": `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
    });
  }

  /**
   * Generate an image from a prompt
   */
  async generate(payload: HuggingFaceGenerateRequest): Promise<HuggingFaceGenerateResponse> {
    const url = `${BASE_URL}/${this.model}`;
    
    try {
      console.log(`Generating image with model: ${this.model}`);
      console.log("Prompt:", payload.inputs);
      
      // Add wait_for_model option
      const requestPayload = {
        ...payload,
        options: {
          wait_for_model: true,
          use_cache: false,
        }
      };
      
      const response = await this.client.post(url, requestPayload, {
        responseType: 'arraybuffer', // Get image as binary
      });

      // Convert binary data to base64
      const base64Image = Buffer.from(response.data, 'binary').toString('base64');
      
      return {
        image: `data:image/png;base64,${base64Image}`
      };
      
    } catch (err: any) {
      // Log the full error for debugging
      console.error("HuggingFace API Error:", {
        status: err.response?.status,
        statusText: err.response?.statusText,
        model: this.model,
      });

      // Handle 410 Gone - Model deprecated/removed
      if (err.response?.status === 410) {
        let errorMessage = "This model is no longer available on Hugging Face's free tier.";
        
        try {
          const errorText = Buffer.from(err.response.data).toString();
          console.error("410 Error details:", errorText);
          
          const errorJson = JSON.parse(errorText);
          if (errorJson.error) {
            errorMessage = errorJson.error;
          }
        } catch (parseErr) {
          // Couldn't parse error, use default message
        }

        throw new Error(`${errorMessage}\n\nRecommendation: Use Pollinations (free, no API key) or switch to Stable Diffusion XL model.`);
      }

      // Handle 404 Not Found - Model doesn't exist
      if (err.response?.status === 404) {
        throw new Error(`Model '${this.model}' not found. It may have been removed from the free tier. Try using Stable Diffusion XL or Pollinations instead.`);
      }
      
      // Handle 503 Service Unavailable - Model loading
      if (err.response?.status === 503) {
        try {
          const errorText = Buffer.from(err.response.data).toString();
          const errorJson = JSON.parse(errorText);
          
          if (errorJson.error?.includes("loading") || errorJson.error?.includes("currently loading")) {
            return {
              error: "Model is loading, please wait 20-30 seconds and try again...",
              estimated_time: errorJson.estimated_time || 20
            };
          }
        } catch (parseErr) {
          // Couldn't parse, return generic loading message
          return {
            error: "Model is loading, please wait and try again...",
            estimated_time: 20
          };
        }
      }

      // Handle 429 Rate Limit
      if (err.response?.status === 429) {
        throw new Error("Rate limit exceeded. Please wait a moment before trying again, or use Pollinations (no rate limits).");
      }

      // Handle 401/403 Authentication errors
      if (err.response?.status === 401 || err.response?.status === 403) {
        throw new Error("Invalid API key. Please check your HUGGINGFACE_API_KEY in .env file.");
      }
      
      // Generic error
      const errorMessage = err.message || "Image generation failed";
      throw new Error(`${errorMessage}. Consider using Pollinations instead - it's free and more reliable!`);
    }
  }

  /**
   * Change the model being used
   */
  setModel(model: string) {
    this.model = model;
    console.log(`Switched to model: ${model}`);
  }

  /**
   * Get current model
   */
  getModel(): string {
    return this.model;
  }
}

export default new HuggingFaceClient();