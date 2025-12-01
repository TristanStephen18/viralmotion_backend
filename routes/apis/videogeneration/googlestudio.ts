import { Router, type Request, type Response } from 'express';
import { GoogleGenAI } from '@google/genai';

const router = Router();

// Initialize the Google GenAI client
const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_API || ''
});

/**
 * POST /generate-video
 * Generate a video using Google's Veo 3.1 model
 * 
 * Body:
 * {
 *   "prompt": "A cat playing piano in a cozy room",
 *   "aspectRatio": "16:9", // optional: "16:9", "9:16", "1:1"
 *   "numberOfVideos": 1, // optional, defaults to 1
 *   "model": "veo-3.1-generate-preview" // optional, defaults to veo-3.1-generate-preview
 * }
 */
router.post('/generate-video', async (req: Request, res: Response) => {
  try {
    const { 
      prompt, 
      aspectRatio = '16:9',
      numberOfVideos = 1,
      model = 'veo-3.1-generate-preview'
    } = req.body;

    if (!prompt) {
      return res.status(400).json({
        error: 'Prompt is required',
        message: 'Please provide a prompt for video generation'
      });
    }

    if (!process.env.GOOGLE_API) {
      return res.status(500).json({
        error: 'API key not configured',
        message: 'GOOGLE_API environment variable is not set'
      });
    }

    console.log('Generating video with prompt:', prompt);
    console.log('Configuration:', { aspectRatio, numberOfVideos, model });

    // Generate video using Veo 3.1
    let operation = await ai.models.generateVideos({
      model: model,
      prompt: prompt,
      config: {
        aspectRatio: aspectRatio,
        numberOfVideos: numberOfVideos,
      }
    });

    // Poll for completion
    let attempts = 0;
    const maxAttempts = 60; // Wait up to 15 minutes (60 * 15 seconds)

    while (!operation.done && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 15000)); // Wait 15 seconds
      operation = await ai.operations.getVideosOperation({ operation });
      attempts++;
      
      console.log(`Polling attempt ${attempts}/${maxAttempts}. Status: ${operation.done ? 'Complete' : 'In progress'}`);
    }

    if (!operation.done) {
      return res.status(408).json({
        error: 'Video generation timeout',
        message: 'Video generation is taking longer than expected. Please try again.',
        operationName: operation.name
      });
    }

    // Extract video data from the completed operation
    const generatedVideos = operation.response?.generatedVideos;

    if (!generatedVideos || generatedVideos.length === 0) {
      return res.status(500).json({
        error: 'No video generated',
        message: 'The API did not return video data',
        response: operation
      });
    }

    const videoData = generatedVideos[0];

    // Return video information
    return res.json({
      success: true,
      video: {
        uri: videoData.video?.uri, // GCS URI
        mimeType: videoData.video?.mimeType || 'video/mp4',
        prompt: prompt,
        aspectRatio: aspectRatio,
        operationName: operation.name
      }
    });

  } catch (error: any) {
    console.error('Error generating video:', error);
    
    return res.status(500).json({
      error: 'Video generation failed',
      message: error.message || 'An error occurred while generating the video',
      details: error.response?.data || error.toString()
    });
  }
});

/**
 * POST /generate-video-from-image
 * Generate a video from an image using Veo 3.1
 * 
 * Body:
 * {
 *   "prompt": "The cat starts playing the piano",
 *   "imageData": "base64-encoded-image-data",
 *   "imageMimeType": "image/jpeg",
 *   "aspectRatio": "16:9" // optional
 * }
 */
router.post('/generate-video-from-image', async (req: Request, res: Response) => {
  try {
    const { 
      prompt, 
      imageData,
      imageMimeType = 'image/jpeg',
      aspectRatio = '16:9',
      model = 'veo-3.1-generate-preview'
    } = req.body;

    if (!prompt || !imageData) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Please provide both prompt and imageData'
      });
    }

    if (!process.env.GOOGLE_API) {
      return res.status(500).json({
        error: 'API key not configured',
        message: 'GOOGLE_API environment variable is not set'
      });
    }

    console.log('Generating video from image with prompt:', prompt);

    // Generate video from image
    let operation = await ai.models.generateVideos({
      model: model,
      prompt: prompt,
      image: {
        imageBytes: imageData, // Already base64 encoded string
        mimeType: imageMimeType
      },
      config: {
        aspectRatio: aspectRatio,
        numberOfVideos: 1
      }
    });

    // Poll for completion
    let attempts = 0;
    const maxAttempts = 60;

    while (!operation.done && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 15000));
      operation = await ai.operations.getVideosOperation({ operation });
      attempts++;
    }

    if (!operation.done) {
      return res.status(408).json({
        error: 'Video generation timeout',
        message: 'Video generation is taking longer than expected.',
        operationName: operation.name
      });
    }

    const generatedVideos = operation.response?.generatedVideos;

    if (!generatedVideos || generatedVideos.length === 0) {
      return res.status(500).json({
        error: 'No video generated',
        message: 'The API did not return video data'
      });
    }

    const videoData = generatedVideos[0];

    return res.json({
      success: true,
      video: {
        uri: videoData.video?.uri,
        mimeType: videoData.video?.mimeType || 'video/mp4',
        prompt: prompt,
        aspectRatio: aspectRatio,
        source: 'image-to-video'
      }
    });

  } catch (error: any) {
    console.error('Error generating video from image:', error);
    
    return res.status(500).json({
      error: 'Video generation failed',
      message: error.message || 'An error occurred while generating the video',
      details: error.toString()
    });
  }
});

/**
 * GET /check-operation/:operationName
 * Check the status of a video generation operation
 */
router.get('/check-operation/:operationName', async (req: Request, res: Response) => {
  try {
    const { operationName } = req.params;

    if (!operationName) {
      return res.status(400).json({
        error: 'Operation name required',
        message: 'Please provide an operation name'
      });
    }

    // Note: We need to pass the operation object, not just the name
    const operation = await ai.operations.getVideosOperation({ 
      operation: { name: operationName } as any
    });

    const videoData = operation.response?.generatedVideos?.[0];

    return res.json({
      done: operation.done,
      operationName: operation.name,
      video: videoData ? {
        uri: videoData.video?.uri,
        mimeType: videoData.video?.mimeType
      } : null
    });

  } catch (error: any) {
    console.error('Error checking operation:', error);
    
    return res.status(500).json({
      error: 'Failed to check operation status',
      message: error.message
    });
  }
});

/**
 * GET /test-connection
 * Test if the Google API key is valid
 */
router.get('/test-connection', async (req: Request, res: Response) => {
  try {
    if (!process.env.GOOGLE_API) {
      return res.status(500).json({
        success: false,
        message: 'GOOGLE_API environment variable is not set'
      });
    }

    // Test with a simple text generation to verify API key
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash-001',
      contents: 'Hello, respond with just "OK"'
    });
    
    return res.json({
      success: true,
      message: 'Google API connection successful',
      apiKeyPresent: true,
      testResponse: response.text
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Failed to connect to Google API',
      error: error.message
    });
  }
});

export default router;