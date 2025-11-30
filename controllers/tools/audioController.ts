import type { Request, Response } from 'express';
import { AuphonicEnhancer } from '../../utils/auphonicEnhancer.ts';

const auphonicEnhancer = new AuphonicEnhancer();

export async function enhanceAudioController(req: Request, res: Response) {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false,
        error: 'No audio file provided' 
      });
    }

    console.log('📥 Received enhancement request:', {
      filename: req.file.originalname,
      size: `${(req.file.size / 1024 / 1024).toFixed(2)} MB`,
      mimetype: req.file.mimetype,
    });

    // Get enhancement options from request
    const denoiseLevel = parseInt(req.body.denoiseLevel) || 7;
    const enhanceClarity = req.body.enhanceClarity === 'true';
    const removeEcho = req.body.removeEcho === 'true';

    console.log('⚙️  Enhancement settings:', {
      denoiseLevel,
      enhanceClarity,
      removeEcho,
    });

    // Enhance with Auphonic
    const result = await auphonicEnhancer.enhanceAudio(req.file.buffer, {
      denoiseLevel,
      enhanceClarity,
      removeEcho,
    });

    console.log('✅ Enhancement completed successfully');

    res.json({
      success: true,
      audioUrl: result.audioUrl,
      productionUuid: result.productionUuid,
      statistics: result.statistics,
    });

  } catch (error: any) {
    console.error('❌ Enhancement failed:', error);
    res.status(500).json({ 
      success: false,
      error: 'Enhancement failed',
      details: error.message 
    });
  }
}