import express from 'express';
import type { Request, Response } from 'express';
import { Router } from 'express';
import {youtubeDl} from 'youtube-dl-exec';
import fs from 'fs';
import path from 'path';

const router: Router = express.Router();

const DOWNLOADS_DIR: string = path.join(process.cwd(), 'downloads');
if (!fs.existsSync(DOWNLOADS_DIR)) {
  fs.mkdirSync(DOWNLOADS_DIR, { recursive: true });
}

const activeDownloads = new Map<string, { 
  progress: number; 
  status: string;
  startTime: number;
}>();

router.get('/info', async (req: Request, res: Response) => {
  try {
    const { videoId } = req.query;

    if (!videoId || typeof videoId !== 'string') {
      return res.status(400).json({ error: 'Video ID is required' });
    }

    const url = `https://www.youtube.com/watch?v=${videoId}`;
    
    console.log(`📹 Fetching info: ${videoId}`);
    
    const info: any = await youtubeDl(url, {
      dumpSingleJson: true,
      noWarnings: true,
      noCheckCertificates: true,
      preferFreeFormats: true,
      skipDownload: true,
    });
    
    const title = info?.title || info?.fulltitle || 'Unknown Title';
    const duration = parseInt(info?.duration) || 0;
    
    let thumbnail = '';
    if (info?.thumbnail) {
      thumbnail = info.thumbnail;
    } else if (info?.thumbnails && Array.isArray(info.thumbnails) && info.thumbnails.length > 0) {
      thumbnail = info.thumbnails[info.thumbnails.length - 1]?.url || '';
    }
    
    const author = info?.uploader || 
                   info?.channel || 
                   info?.uploader_id || 
                   info?.creator || 
                   'Unknown';
    
    const viewCount = parseInt(info?.view_count) || 0;
    
    console.log(`✅ Info fetched: ${title}`);
    
    res.json({
      title,
      duration,
      thumbnail,
      author,
      viewCount,
    });
  } catch (error: any) {
    console.error('❌ Error fetching info:', error.message);
    res.status(500).json({ 
      error: 'Failed to fetch video info',
      details: error.message 
    });
  }
});

router.get('/download-progress/:downloadId', (req: Request, res: Response) => {
  const { downloadId } = req.params;
  
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  
  const interval = setInterval(() => {
    const download = activeDownloads.get(downloadId);
    
    if (download) {
      res.write(`data: ${JSON.stringify(download)}\n\n`);
      
      if (download.progress >= 100) {
        clearInterval(interval);
        res.end();
        activeDownloads.delete(downloadId);
      }
    }
  }, 500);
  
  req.on('close', () => {
    clearInterval(interval);
  });
});

router.post('/download', async (req: Request, res: Response) => {
  const downloadId = Date.now().toString();
  
  try {
    const { videoId, quality = '720p', format = 'mp4' } = req.body;

    if (!videoId) {
      return res.status(400).json({ error: 'Video ID is required' });
    }

    const url = `https://www.youtube.com/watch?v=${videoId}`;
    const timestamp = Date.now();
    
    console.log(`\n📥 Download started: ${videoId} (${format} ${quality})`);
    
    activeDownloads.set(downloadId, { 
      progress: 0, 
      status: 'Starting...',
      startTime: Date.now()
    });

    const safeFilename = `video_${timestamp}`;
    const outputTemplate = path.join(DOWNLOADS_DIR, `${safeFilename}.%(ext)s`);

    if (format === 'mp3') {
      const child = youtubeDl.exec(url, {
        extractAudio: true,
        audioFormat: 'mp3',
        audioQuality: 0,
        output: outputTemplate,
        noWarnings: true,
        noCheckCertificates: true,
      });
      
      let lastLogged = 0;
      
      child.stdout?.on('data', (data: Buffer) => {
        const output = data.toString();
        
        if (output.includes('[download]')) {
          const match = output.match(/(\d+\.?\d*)%/);
          if (match) {
            const percent = parseFloat(match[1]);
            const adjusted = Math.min(percent * 0.7, 70);
            
            if (Math.floor(adjusted / 10) > Math.floor(lastLogged / 10)) {
              console.log(`   📊 ${adjusted.toFixed(0)}% - Downloading...`);
              lastLogged = adjusted;
            }
            
            activeDownloads.set(downloadId, { 
              progress: adjusted, 
              status: 'Downloading...',
              startTime: activeDownloads.get(downloadId)?.startTime || Date.now()
            });
          }
        }
        
        if (output.includes('[ffmpeg]') || output.includes('[ExtractAudio]')) {
          console.log(`   🔄 Converting to MP3...`);
          activeDownloads.set(downloadId, { 
            progress: 80, 
            status: 'Converting...',
            startTime: activeDownloads.get(downloadId)?.startTime || Date.now()
          });
        }
      });
      
      await child;
      
      const files = fs.readdirSync(DOWNLOADS_DIR);
      const downloadedFile = files.find(f => 
        f.includes(`video_${timestamp}`) && f.endsWith('.mp3')
      );

      if (!downloadedFile) {
        throw new Error('File not found after download');
      }

      const filePath = path.join(DOWNLOADS_DIR, downloadedFile);
      const fileSize = fs.statSync(filePath).size;
      const elapsed = ((Date.now() - (activeDownloads.get(downloadId)?.startTime || Date.now())) / 1000).toFixed(1);
      
      console.log(`✅ Complete: ${downloadedFile} (${(fileSize / 1024 / 1024).toFixed(2)} MB) - ${elapsed}s\n`);
      
      activeDownloads.set(downloadId, { 
        progress: 100, 
        status: 'Complete!',
        startTime: activeDownloads.get(downloadId)?.startTime || Date.now()
      });
      
      return res.json({
        downloadId,
        url: `/downloads/${downloadedFile}`,
        filename: downloadedFile,
        format: 'mp3',
        fileSize,
      });
      
    } else {
      const ext = format === 'webm' ? 'webm' : 'mp4';
      let formatString = 'best';
      
      if (quality === '720p') {
        formatString = 'bestvideo[height<=720][ext=mp4]+bestaudio[ext=m4a]/best[height<=720]';
      } else if (quality === '1080p') {
        formatString = 'bestvideo[height<=1080][ext=mp4]+bestaudio[ext=m4a]/best[height<=1080]';
      } else if (quality === '4K') {
        formatString = 'bestvideo[height<=2160][ext=mp4]+bestaudio[ext=m4a]/best[height<=2160]';
      }
      
      const child = youtubeDl.exec(url, {
        format: formatString,
        mergeOutputFormat: ext,
        output: outputTemplate,
        noWarnings: true,
        noCheckCertificates: true,
      });
      
      let lastLogged = 0;
      
      child.stdout?.on('data', (data: Buffer) => {
        const output = data.toString();
        
        if (output.includes('[download]')) {
          const match = output.match(/(\d+\.?\d*)%/);
          if (match) {
            const percent = parseFloat(match[1]);
            const adjusted = Math.min(percent * 0.8, 80);
            
            if (Math.floor(adjusted / 10) > Math.floor(lastLogged / 10)) {
              console.log(`   📊 ${adjusted.toFixed(0)}% - Downloading...`);
              lastLogged = adjusted;
            }
            
            activeDownloads.set(downloadId, { 
              progress: adjusted, 
              status: 'Downloading...',
              startTime: activeDownloads.get(downloadId)?.startTime || Date.now()
            });
          }
        }
        
        if (output.includes('[Merger]') || output.includes('Merging')) {
          console.log(`   🔄 Merging video and audio...`);
          activeDownloads.set(downloadId, { 
            progress: 90, 
            status: 'Merging...',
            startTime: activeDownloads.get(downloadId)?.startTime || Date.now()
          });
        }
      });
      
      await child;
      
      const files = fs.readdirSync(DOWNLOADS_DIR);
      const downloadedFile = files.find(f => 
        f.includes(`video_${timestamp}`) && (f.endsWith('.mp4') || f.endsWith('.webm'))
      );

      if (!downloadedFile) {
        throw new Error('File not found after download');
      }

      const filePath = path.join(DOWNLOADS_DIR, downloadedFile);
      const fileSize = fs.statSync(filePath).size;
      const elapsed = ((Date.now() - (activeDownloads.get(downloadId)?.startTime || Date.now())) / 1000).toFixed(1);
      
      console.log(`✅ Complete: ${downloadedFile} (${(fileSize / 1024 / 1024).toFixed(2)} MB) - ${elapsed}s\n`);
      
      activeDownloads.set(downloadId, { 
        progress: 100, 
        status: 'Complete!',
        startTime: activeDownloads.get(downloadId)?.startTime || Date.now()
      });
      
      return res.json({
        downloadId,
        url: `/downloads/${downloadedFile}`,
        filename: downloadedFile,
        format: ext,
        fileSize,
      });
    }
    
  } catch (error: any) {
    console.error(`❌ Download failed: ${error.message}\n`);
    activeDownloads.delete(downloadId);
    res.status(500).json({ 
      error: 'Failed to download video',
      details: error.message 
    });
  }
});

router.get('/list-downloads', (req: Request, res: Response) => {
  try {
    const files = fs.readdirSync(DOWNLOADS_DIR);
    const fileDetails = files.map(file => {
      const stats = fs.statSync(path.join(DOWNLOADS_DIR, file));
      return {
        name: file,
        size: `${(stats.size / 1024 / 1024).toFixed(2)} MB`,
        created: stats.birthtime,
      };
    });
    res.json({ files: fileDetails, directory: DOWNLOADS_DIR });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/test-ytdlp', async (req: Request, res: Response) => {
  try {
    const version = await youtubeDl('--version', {});
    res.json({ 
      installed: true, 
      version: version,
      message: 'yt-dlp is working!' 
    });
  } catch (error: any) {
    res.status(500).json({ 
      installed: false, 
      error: error.message,
      message: 'yt-dlp is not installed or not accessible' 
    });
  }
});

router.post('/cleanup', (req: Request, res: Response) => {
  try {
    const files = fs.readdirSync(DOWNLOADS_DIR);
    const now = Date.now();
    const maxAge = 2 * 60 * 60 * 1000;
    
    let deleted = 0;
    
    files.forEach(file => {
      const filePath = path.join(DOWNLOADS_DIR, file);
      const stats = fs.statSync(filePath);
      if (now - stats.mtimeMs > maxAge) {
        fs.unlinkSync(filePath);
        deleted++;
      }
    });
    
    res.json({ 
      message: `Cleaned up ${deleted} old files`,
      deleted 
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;