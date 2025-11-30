export interface GenerateRequest {
  prompt: string;
  width?: number;
  height?: number;
  steps?: number;
  // add other fields that the real API expects (sampler, seed, cfg, etc.)
  [key: string]: unknown;
}

export interface GenerateResponse {
  // We keep this generic because actual response shape depends on API
  id?: string;
  // e.g. base64 image(s) or url(s)
  results?: unknown;
  raw?: unknown;
}
