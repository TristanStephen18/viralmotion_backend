import { Router } from 'express';
import {youtubeDl} from 'youtube-dl-exec';
import fs from 'fs';
import path from 'path';

const router = Router();

const DOWNLOADS_DIR = path.join(process.cwd(), 'downloads');

if (!fs.existsSync(DOWNLOADS_DIR)) {
  fs.mkdirSync(DOWNLOADS_DIR, { recursive: true });
}

const activeDownloads = new Map();

// Get video info
router.get('/info', async (req, res) => {
  try {
    const { videoId } = req.query;

    if (!videoId || typeof videoId !== 'string') {
      return res.status(400).json({ error: 'Video ID is required' });
    }

    const url = `https://www.youtube.com/watch?v=${videoId}`;
    
    console.log(`📹 Fetching info: ${videoId}`);
    
    const info = await youtubeDl(url, {
      dumpSingleJson: true,
      noWarnings: true,
      noCheckCertificates: true,
      preferFreeFormats: true,
      skipDownload: true,
    })as any;
    
    const title = info?.title || 'Unknown Title';
    const duration = parseInt(info?.duration) || 0;
    const thumbnail = info?.thumbnail || '';
    const author = info?.uploader || 'Unknown';
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
    console.error('❌ Error:', error.message);
    res.status(500).json({ 
      error: 'Failed to fetch video info',
      details: error.message 
    });
  }
});

// Download progress SSE
router.get('/download-progress/:downloadId', (req, res) => {
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
  
  req.on('close', () => clearInterval(interval));
});

// Download video/audio
router.post('/download', async (req, res) => {
  const downloadId = Date.now().toString();
  
  try {
    const { videoId, quality = '720p', format = 'mp4' } = req.body;

    if (!videoId) {
      return res.status(400).json({ error: 'Video ID is required' });
    }

    const url = `https://www.youtube.com/watch?v=${videoId}`;
    const timestamp = Date.now();
    
    console.log(`\n📥 Download: ${videoId} (${format} ${quality})`);
    
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
      });
      
      let lastLogged = 0;
      
      child.stdout?.on('data', (data) => {
        const output = data.toString();
        
        if (output.includes('[download]')) {
          const match = output.match(/(\d+\.?\d*)%/);
          if (match) {
            const percent = parseFloat(match[1]);
            const adjusted = Math.min(percent * 0.7, 70);
            
            if (Math.floor(adjusted / 10) > Math.floor(lastLogged / 10)) {
              console.log(`   📊 ${adjusted.toFixed(0)}%`);
              lastLogged = adjusted;
            }
            
            activeDownloads.set(downloadId, { 
              progress: adjusted, 
              status: 'Downloading...',
              startTime: activeDownloads.get(downloadId)?.startTime || Date.now()
            });
          }
        }
        
        if (output.includes('[ffmpeg]')) {
          console.log(`   🔄 Converting...`);
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
        throw new Error('File not found');
      }

      const fileSize = fs.statSync(path.join(DOWNLOADS_DIR, downloadedFile)).size;
      
      console.log(`✅ Complete: ${(fileSize / 1024 / 1024).toFixed(2)} MB\n`);
      
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
      
      if (quality === '720p') formatString = 'bestvideo[height<=720]+bestaudio/best[height<=720]';
      if (quality === '1080p') formatString = 'bestvideo[height<=1080]+bestaudio/best[height<=1080]';
      if (quality === '4K') formatString = 'bestvideo[height<=2160]+bestaudio/best[height<=2160]';
      
      const child = youtubeDl.exec(url, {
        format: formatString,
        mergeOutputFormat: ext,
        output: outputTemplate,
        noWarnings: true,
      });
      
      let lastLogged = 0;
      
      child.stdout?.on('data', (data) => {
        const output = data.toString();
        
        if (output.includes('[download]')) {
          const match = output.match(/(\d+\.?\d*)%/);
          if (match) {
            const percent = parseFloat(match[1]);
            const adjusted = Math.min(percent * 0.8, 80);
            
            if (Math.floor(adjusted / 10) > Math.floor(lastLogged / 10)) {
              console.log(`   📊 ${adjusted.toFixed(0)}%`);
              lastLogged = adjusted;
            }
            
            activeDownloads.set(downloadId, { 
              progress: adjusted, 
              status: 'Downloading...',
              startTime: activeDownloads.get(downloadId)?.startTime || Date.now()
            });
          }
        }
        
        if (output.includes('[Merger]')) {
          console.log(`   🔄 Merging...`);
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
        throw new Error('File not found');
      }

      const fileSize = fs.statSync(path.join(DOWNLOADS_DIR, downloadedFile)).size;
      
      console.log(`✅ Complete: ${(fileSize / 1024 / 1024).toFixed(2)} MB\n`);
      
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
    console.error(`❌ Failed: ${error.message}\n`);
    activeDownloads.delete(downloadId);
    res.status(500).json({ 
      error: 'Download failed',
      details: error.message 
    });
  }
});

router.get('/test-ytdlp', async (req, res) => {
  try {
    const version = await youtubeDl('--version', {});
    res.json({ installed: true, version });
  } catch (error: any) {
    res.status(500).json({ installed: false, error: error.message });
  }
});

router.get('/list-downloads', (req, res) => {
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

export default router;