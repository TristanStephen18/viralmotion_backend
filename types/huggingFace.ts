export interface HuggingFaceGenerateRequest {
  prompt: string;
  negative_prompt?: string;
  width?: number;
  height?: number;
  steps?: number;
  guidance_scale?: number;
  model?: string;
}

export interface HuggingFaceGenerateResponse {
  image?: string; // base64 data URL
  error?: string;
  estimated_time?: number;
  model_used?: string;
}