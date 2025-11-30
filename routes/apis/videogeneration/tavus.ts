// routes/tavus.routes.ts
import type {  Request, Response } from 'express';
import { Router } from 'express';
import dotenv from 'dotenv';

dotenv.config();

const router = Router();

const TAVUS_API_KEY = process.env.TAVUS_API_KEY;
const TAVUS_API_BASE = 'https://tavusapi.com/v2';

// Types
interface CreateVideoRequest {
  script: string;
  replica_id?: string;
  video_name?: string;
  background_url?: string;
}

interface VideoStatusResponse {
  video_id: string;
  video_name: string;
  status: 'queued' | 'generating' | 'ready' | 'deleted' | 'error';
  hosted_url: string;
  download_url?: string;
  created_at: string;
}

interface ReplicaResponse {
  replica_id: string;
  replica_name: string;
  status: string;
  created_at: string;
}

// Generate video with Tavus
router.post('/generate', async (req: Request<{}, {}, CreateVideoRequest>, res: Response) => {
  try {
    const { script, replica_id, video_name, background_url } = req.body;

    if (!script) {
      return res.status(400).json({
        success: false,
        error: 'Script is required'
      });
    }

    if (!TAVUS_API_KEY) {
      return res.status(500).json({
        success: false,
        error: 'Tavus API key not configured'
      });
    }

    console.log('Generating Tavus video with script:', script);

    const response = await fetch(`${TAVUS_API_BASE}/videos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': TAVUS_API_KEY
      },
      body: JSON.stringify({
        replica_id: replica_id, // Use provided replica or default stock replica
        script: script,
        video_name: video_name || `Video ${Date.now()}`,
        background_url: background_url
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Tavus API error: ${response.status} - ${errorText}`);
    }

    const data: VideoStatusResponse = await response.json();

    res.json({
      success: true,
      video_id: data.video_id,
      video_name: data.video_name,
      status: data.status,
      hosted_url: data.hosted_url,
      message: 'Video generation started. Use the video_id to check status.'
    });

  } catch (error: any) {
    console.error('Tavus video generation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate video',
      details: error.message
    });
  }
});

// Check video status
router.get('/status/:videoId', async (req: Request, res: Response) => {
  try {
    const { videoId } = req.params;

    if (!TAVUS_API_KEY) {
      return res.status(500).json({
        success: false,
        error: 'Tavus API key not configured'
      });
    }

    const response = await fetch(`${TAVUS_API_BASE}/videos/${videoId}`, {
      method: 'GET',
      headers: {
        'x-api-key': TAVUS_API_KEY
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Tavus API error: ${response.status} - ${errorText}`);
    }

    const data: VideoStatusResponse = await response.json();

    res.json({
      success: true,
      video_id: data.video_id,
      status: data.status,
      hosted_url: data.hosted_url,
      download_url: data.download_url,
      created_at: data.created_at,
      ready: data.status === 'ready'
    });

  } catch (error: any) {
    console.error('Tavus status check error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check video status',
      details: error.message
    });
  }
});

// List available stock replicas
router.get('/replicas', async (req: Request, res: Response) => {
  try {
    if (!TAVUS_API_KEY) {
      return res.status(500).json({
        success: false,
        error: 'Tavus API key not configured'
      });
    }

    const response = await fetch(`${TAVUS_API_BASE}/replicas`, {
      method: 'GET',
      headers: {
        'x-api-key': TAVUS_API_KEY
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Tavus API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    res.json({
      success: true,
      replicas: data
    });

  } catch (error: any) {
    console.error('Tavus replicas list error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to list replicas',
      details: error.message
    });
  }
});

// Download video
router.get('/download/:videoId', async (req: Request, res: Response) => {
  try {
    const { videoId } = req.params;

    if (!TAVUS_API_KEY) {
      return res.status(500).json({
        success: false,
        error: 'Tavus API key not configured'
      });
    }

    // First get video status to get download URL
    const statusResponse = await fetch(`${TAVUS_API_BASE}/videos/${videoId}`, {
      method: 'GET',
      headers: {
        'x-api-key': TAVUS_API_KEY
      }
    });

    if (!statusResponse.ok) {
      throw new Error(`Failed to get video status: ${statusResponse.statusText}`);
    }

    const videoData: VideoStatusResponse = await statusResponse.json();

    if (videoData.status !== 'ready') {
      return res.status(400).json({
        success: false,
        error: 'Video is not ready yet',
        status: videoData.status
      });
    }

    // Download the video from hosted URL
    const downloadUrl = videoData.download_url || videoData.hosted_url;
    const videoResponse = await fetch(downloadUrl);

    if (!videoResponse.ok) {
      throw new Error(`Failed to download video: ${videoResponse.statusText}`);
    }

    const videoBuffer = Buffer.from(await videoResponse.arrayBuffer());

    res.set({
      'Content-Type': 'video/mp4',
      'Content-Disposition': `attachment; filename="tavus_${videoId}.mp4"`
    });
    res.send(videoBuffer);

  } catch (error: any) {
    console.error('Tavus video download error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to download video',
      details: error.message
    });
  }
});

// Health check
router.get('/health', (req: Request, res: Response) => {
  res.json({
    success: true,
    service: 'Tavus Video Generation',
    api_key_configured: !!TAVUS_API_KEY,
    timestamp: new Date().toISOString()
  });
});

export default router;