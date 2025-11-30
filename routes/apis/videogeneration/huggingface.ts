// routes/video.routes.ts
import type { Request, Response } from 'express';
import { Router } from 'express';
import { HfInference } from '@huggingface/inference';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const router = Router();

// Initialize Hugging Face client
const hf = new HfInference(process.env.HUGGINGFACE_API_KEY || 'your_HUGGINGFACE_API_KEY_here');

// Types
interface GenerateVideoRequest {
  prompt: string;
  model?: string;
  numFrames?: number;
  fps?: number;
}

interface VideoResponse {
  success: boolean;
  filename?: string;
  error?: string;
  details?: string;
}

// Helper function to generate video with retry logic using direct API
async function generateWithRetry(
  prompt: string, 
  model: string = 'THUDM/CogVideoX-5b',
  maxRetries: number = 3
): Promise<Buffer> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(
        `https://huggingface.co/api/models/${model}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ inputs: prompt }),
        }
      );

      if (!response.ok) {
        if (response.status === 503 && i < maxRetries - 1) {
          console.log(`Retry ${i + 1}/${maxRetries}... Model is loading`);
          await new Promise(resolve => setTimeout(resolve, 5000));
          continue;
        }
        const errorText = await response.text();
        throw new Error(`API error: ${response.statusText} - ${errorText}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch (error: any) {
      if (i < maxRetries - 1 && (error.message?.includes('503') || error.message?.includes('loading'))) {
        console.log(`Retry ${i + 1}/${maxRetries}...`);
        await new Promise(resolve => setTimeout(resolve, 5000));
        continue;
      }
      throw error;
    }
  }
  throw new Error('Max retries exceeded');
}

// Helper function to ensure directory exists
function ensureDirectoryExists(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

// METHOD 1: Generate video using direct API (recommended)
router.post('/generate', async (req: Request<{}, {}, GenerateVideoRequest>, res: Response) => {
  try {
    const { prompt, model = 'THUDM/CogVideoX-5b' } = req.body;

    if (!prompt) {
      return res.status(400).json({ 
        success: false,
        error: 'Prompt is required' 
      });
    }

    console.log('Generating video for prompt:', prompt);

    // Generate video with retry logic
    const buffer = await generateWithRetry(prompt, model);

    // Save video to filesystem (optional)
    const filename = `video_${Date.now()}.mp4`;
    const generatedDir = path.join(process.cwd(), 'generated_videos');
    const filepath = path.join(generatedDir, filename);
    
    ensureDirectoryExists(generatedDir);
    fs.writeFileSync(filepath, buffer);

    // Send video back as response
    res.set({
      'Content-Type': 'video/mp4',
      'Content-Disposition': `attachment; filename="${filename}"`,
    });
    res.send(buffer);

  } catch (error: any) {
    console.error('Video generation error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to generate video',
      details: error.message 
    });
  }
});

// METHOD 2: Generate video using direct API calls
router.post('/generate-direct', async (req: Request<{}, {}, GenerateVideoRequest>, res: Response) => {
  try {
    const { 
      prompt, 
      model = 'THUDM/CogVideoX-5b',
      numFrames = 49,
      fps = 8
    } = req.body;

    if (!prompt) {
      return res.status(400).json({ 
        success: false,
        error: 'Prompt is required' 
      });
    }

    console.log('Generating video directly for prompt:', prompt);

    // Call Hugging Face Inference API directly
    const response = await fetch(
      `https://huggingface.co/api/models/${model}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: {
            num_frames: numFrames,
            fps: fps,
          }
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API error: ${response.statusText} - ${errorText}`);
    }

    // Get video buffer
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Save video
    const filename = `video_${Date.now()}.mp4`;
    const generatedDir = path.join(process.cwd(), 'generated_videos');
    const filepath = path.join(generatedDir, filename);
    
    ensureDirectoryExists(generatedDir);
    fs.writeFileSync(filepath, buffer);

    // Send video back
    res.set({
      'Content-Type': 'video/mp4',
      'Content-Disposition': `attachment; filename="${filename}"`,
    });
    res.send(buffer);

  } catch (error: any) {
    console.error('Video generation error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to generate video',
      details: error.message 
    });
  }
});

// Get list of available models
router.get('/models', (req: Request, res: Response) => {
  const models = [
    { 
      id: 'THUDM/CogVideoX-5b', 
      name: 'CogVideoX-5b',
      description: 'Good quality 6-second videos'
    },
    { 
      id: 'guoyww/animatediff', 
      name: 'AnimateDiff',
      description: 'Good for animations'
    },
    { 
      id: 'stabilityai/stable-video-diffusion-img2vid-xt', 
      name: 'Stable Video Diffusion',
      description: 'Image to video conversion'
    },
    { 
      id: 'Lightricks/LTX-Video', 
      name: 'LTX-Video',
      description: 'Fast generation'
    }
  ];

  res.json({ success: true, models });
});

// Health check endpoint
router.get('/health', (req: Request, res: Response) => {
  res.json({ 
    success: true, 
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

router.post('/test-api', async (req: Request, res: Response) => {
  try {
    // Test with a simple image generation model first
    const response = await fetch(
      'https://router.huggingface.co/models/black-forest-labs/FLUX.1-schnell',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ inputs: "a cat" }),
      }
    );

    const responseText = await response.text();
    
    res.json({ 
      success: response.ok,
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      bodyPreview: responseText.substring(0, 200),
      apiKeySet: !!process.env.HUGGINGFACE_API_KEY,
      message: response.ok ? 
        'API key is valid! But video generation may not be available on free tier.' : 
        'API call failed - check your API key'
    });
  } catch (error: any) {
    res.json({ 
      success: false,
      error: error.message,
      apiKeySet: !!process.env.HUGGINGFACE_API_KEY
    });
  }
});

export default router;