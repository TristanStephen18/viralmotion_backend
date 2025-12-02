export interface VEO3GenerationRequest {
  prompt: string;
  model: "veo-3.1-generate-preview" | "veo-3.1-fast-generate-preview" | "veo-3.0-generate-preview";
  duration: "5" | "8";
  aspectRatio: "16:9" | "9:16" | "1:1";
  referenceType?: "ASSET" | "STYLE";
}

export interface VEO3Generation {
  id: string;
  userId: number;
  prompt: string;
  model: string;
  duration: string;
  aspectRatio: string;
  status: "pending" | "processing" | "completed" | "failed";
  videoUrl: string | null;
  thumbnailUrl: string | null;
  errorMessage: string | null;
  metadata: Record<string, any> | null;
  createdAt: Date;
  completedAt: Date | null;
  referenceImageUrl?: string | null;
  referenceType?: string | null;
}

export interface VEO3APIResponse {
  success: boolean;
  generation?: VEO3Generation;
  generations?: VEO3Generation[];
  error?: string;
  message?: string;
}