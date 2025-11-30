import { Router } from 'express';
import multer from 'multer';
import { enhanceAudioController } from '../../controllers/tools/audioController.ts';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { 
    fileSize: 100 * 1024 * 1024, // 100MB max file size
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'audio/mpeg',
      'audio/mp3',
      'audio/wav',
      'audio/wave',
      'audio/x-wav',
      'audio/mp4',
      'audio/m4a',
      'audio/x-m4a',
      'audio/ogg',
      'audio/webm',
      'audio/flac',
      'audio/aac',
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type: ${file.mimetype}. Only audio files are allowed.`));
    }
  },
});

// POST /api/enhance-speech - Enhance audio with Auphonic
router.post('/enhance-speech', upload.single('audio'), enhanceAudioController);

export default router;