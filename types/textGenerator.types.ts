// src/types/textGenerator.types.ts

export interface GenerateTextRequest {
  topic: string;
  contentType: ContentType;
  tone: ToneType;
  length: LengthType;
  additionalContext?: string;
}

export interface GenerateTextResponse {
  success: boolean;
  content: string;
  metadata: {
    contentType: string;
    tone: string;
    length: string;
    wordCount: number;
    characterCount: number;
  };
}

export interface ErrorResponse {
  error: string;
}

export type ContentType = "blog" | "social" | "email" | "product" | "ad" | "story";

export type ToneType = 
  | "professional" 
  | "casual" 
  | "friendly" 
  | "formal" 
  | "enthusiastic" 
  | "persuasive";

export type LengthType = "short" | "medium" | "long";

export interface ContentTypeConfig {
  instruction: string;
  structure: string;
  style: string;
}

export interface LengthConfig {
  words: number;
  tokens: number;
  description: string;
}