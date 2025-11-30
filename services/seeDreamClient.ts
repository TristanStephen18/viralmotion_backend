import axios from "axios";
import type { AxiosInstance } from "axios";
import type { GenerateRequest, GenerateResponse } from "../types/seeDream.ts";

const API_KEY = process.env.SEEDREAM_API_KEY;
const BASE = process.env.SEEDREAM_API_BASE || "https://ark.ap-southeast.bytepluses.com";
const PATH = process.env.SEEDREAM_API_PATH || "/api/v3/images/generations";

if (!API_KEY) {
  console.warn("Warning: SEEDREAM_API_KEY is not set. Set it in your .env");
}

class SeedreamClient {
  private client: AxiosInstance;
  private fullUrl: string;

  constructor() {
    // Create full URL by combining base and path
    this.fullUrl = `${BASE}${PATH}`;
    
    this.client = axios.create({
      timeout: 60_000, // Increased timeout for image generation
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${API_KEY}`,
        "Accept": "application/json",
      },
    });
  }

  async generate(payload: GenerateRequest): Promise<GenerateResponse> {
    try {
      console.log("Making request to:", this.fullUrl);
      console.log("Request payload:", JSON.stringify(payload, null, 2));
      
      const resp = await this.client.post(this.fullUrl, payload);
      
      console.log("Seedream API raw response:", JSON.stringify(resp.data, null, 2));
      return { raw: resp.data };
    } catch (err: any) {
      // Enhanced error logging
      console.error("Full error object:", err);
      console.error("STATUS:", err?.response?.status);
      console.error("HEADERS:", err?.response?.headers);
      console.error("BODY:", JSON.stringify(err?.response?.data, null, 2));
      console.error("Request URL:", this.fullUrl);
      console.error("Request config:", err?.config);
      
      const message = err?.response?.data?.message || err.message;
      const status = err?.response?.status || 500;
      const error: any = new Error(message);
      error.status = status;
      error.details = err?.response?.data;
      throw error;
    }
  }
}

export default new SeedreamClient();