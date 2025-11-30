import { Router } from 'express';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { supabase, SUPABASE_BUCKET } from '../../utils/supabaseClient.ts';

const execPromise = promisify(exec);
const router = Router();

const activeDownloads = new Map();

// Helper: Execute yt-dlp command
async function runYtDlp(args: string[]): Promise<string> {
  const command = `yt-dlp ${args.join(' ')}`;
  const { stdout } = await execPromise(command);
  return stdout;
}

// Helper: Get video info
async function getVideoInfo(videoId: string) {
  const url = `https://www.youtube.com/watch?v=${videoId}`;
  const output = await runYtDlp([
    '--dump-json',
    '--no-warnings',
    '--skip-download',
    `"${url}"`
  ]);
  
  return JSON.parse(output);
}

// Helper: Upload to Supabase
async function uploadToSupabase(
  filePath: string, 
  filename: string, 
  contentType: string
): Promise<string> {
  const fileBuffer = fs.readFileSync(filePath);
  
  const { data, error } = await supabase.storage
    .from(SUPABASE_BUCKET)
    .upload(`downloads/${filename}`, fileBuffer, {
      contentType,
      upsert: false
    });

  if (error) {
    throw new Error(`Supabase upload failed: ${error.message}`);
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from(SUPABASE_BUCKET)
    .getPublicUrl(`downloads/${filename}`);

  return urlData.publicUrl;
}

// Helper: Clean up temp file
function cleanupTempFile(filePath: string) {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (err) {
    console.error('Cleanup error:', err);
  }
}

// Get video info
router.get('/info', async (req, res) => {
  try {
    const { videoId } = req.query;

    if (!videoId || typeof videoId !== 'string') {
      return res.status(400).json({ error: 'Video ID is required' });
    }

    console.log(`📹 Fetching info: ${videoId}`);
    
    const info = await getVideoInfo(videoId);
    
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
      
      if (download.progress >= 100 || download.status === 'error') {
        clearInterval(interval);
        res.end();
      }
    }
  }, 500);
  
  req.on('close', () => clearInterval(interval));
});

// Download video/audio
router.post('/download', async (req, res) => {
  const downloadId = Date.now().toString();
  let tempFilePath = '';
  
  try {
    const { videoId, quality = '720p', format = 'mp4' } = req.body;

    if (!videoId) {
      return res.status(400).json({ error: 'Video ID is required' });
    }

    const url = `https://www.youtube.com/watch?v=${videoId}`;
    const timestamp = Date.now();
    const tempDir = os.tmpdir();
    
    console.log(`\n📥 Download: ${videoId} (${format} ${quality})`);
    
    activeDownloads.set(downloadId, { 
      progress: 0, 
      status: 'Starting download...',
      startTime: Date.now()
    });

    // Get video info for filename
    const info = await getVideoInfo(videoId);
    const sanitizedTitle = (info.title || 'video')
      .replace(/[^a-z0-9]/gi, '_')
      .substring(0, 50);

    if (format === 'mp3') {
      const filename = `${sanitizedTitle}_${timestamp}.mp3`;
      tempFilePath = path.join(tempDir, filename);
      
      activeDownloads.set(downloadId, { 
        progress: 10, 
        status: 'Downloading audio...',
        startTime: activeDownloads.get(downloadId)?.startTime || Date.now()
      });

      // Download as mp3
      await runYtDlp([
        '-x',
        '--audio-format', 'mp3',
        '--audio-quality', '0',
        '-o', `"${tempFilePath}"`,
        '--no-warnings',
        `"${url}"`
      ]);
      
      activeDownloads.set(downloadId, { 
        progress: 70, 
        status: 'Uploading to cloud...',
        startTime: activeDownloads.get(downloadId)?.startTime || Date.now()
      });

      // Upload to Supabase
      const publicUrl = await uploadToSupabase(
        tempFilePath, 
        filename, 
        'audio/mpeg'
      );
      
      const fileSize = fs.statSync(tempFilePath).size;
      
      // Cleanup
      cleanupTempFile(tempFilePath);
      
      console.log(`✅ Complete: ${(fileSize / 1024 / 1024).toFixed(2)} MB\n`);
      
      activeDownloads.set(downloadId, { 
        progress: 100, 
        status: 'Complete!',
        startTime: activeDownloads.get(downloadId)?.startTime || Date.now()
      });
      
      return res.json({
        downloadId,
        url: publicUrl,
        filename,
        format: 'mp3',
        fileSize,
      });
      
    } else {
      // Video download
      const ext = format === 'webm' ? 'webm' : 'mp4';
      const filename = `${sanitizedTitle}_${timestamp}.${ext}`;
      tempFilePath = path.join(tempDir, filename);
      
      let formatString = 'best';
      if (quality === '720p') formatString = 'bestvideo[height<=720]+bestaudio/best[height<=720]';
      if (quality === '1080p') formatString = 'bestvideo[height<=1080]+bestaudio/best[height<=1080]';
      if (quality === '4K') formatString = 'bestvideo[height<=2160]+bestaudio/best[height<=2160]';
      
      activeDownloads.set(downloadId, { 
        progress: 10, 
        status: 'Downloading video...',
        startTime: activeDownloads.get(downloadId)?.startTime || Date.now()
      });

      await runYtDlp([
        '-f', formatString,
        '--merge-output-format', ext,
        '-o', `"${tempFilePath}"`,
        '--no-warnings',
        `"${url}"`
      ]);
      
      activeDownloads.set(downloadId, { 
        progress: 70, 
        status: 'Uploading to cloud...',
        startTime: activeDownloads.get(downloadId)?.startTime || Date.now()
      });

      // Upload to Supabase
      const publicUrl = await uploadToSupabase(
        tempFilePath, 
        filename, 
        `video/${ext}`
      );
      
      const fileSize = fs.statSync(tempFilePath).size;
      
      // Cleanup
      cleanupTempFile(tempFilePath);
      
      console.log(`✅ Complete: ${(fileSize / 1024 / 1024).toFixed(2)} MB\n`);
      
      activeDownloads.set(downloadId, { 
        progress: 100, 
        status: 'Complete!',
        startTime: activeDownloads.get(downloadId)?.startTime || Date.now()
      });
      
      return res.json({
        downloadId,
        url: publicUrl,
        filename,
        format: ext,
        fileSize,
      });
    }
    
  } catch (error: any) {
    console.error(`❌ Failed: ${error.message}\n`);
    
    // Cleanup temp file on error
    if (tempFilePath) {
      cleanupTempFile(tempFilePath);
    }
    
    activeDownloads.set(downloadId, { 
      progress: 0, 
      status: 'error',
      error: error.message
    });
    
    res.status(500).json({ 
      error: 'Download failed',
      details: error.message 
    });
  }
});

// Test yt-dlp installation
router.get('/test-ytdlp', async (req, res) => {
  try {
    const version = await runYtDlp(['--version']);
    res.json({ installed: true, version: version.trim() });
  } catch (error: any) {
    res.status(500).json({ installed: false, error: error.message });
  }
});

// List files in Supabase bucket
router.get('/list-downloads', async (req, res) => {
  try {
    const { data, error } = await supabase.storage
      .from(SUPABASE_BUCKET)
      .list('downloads', {
        limit: 100,
        offset: 0,
        sortBy: { column: 'created_at', order: 'desc' }
      });

    if (error) throw error;

    const fileDetails = data.map(file => ({
      name: file.name,
      size: `${(file.metadata.size / 1024 / 1024).toFixed(2)} MB`,
      created: file.created_at,
      url: supabase.storage.from(SUPABASE_BUCKET).getPublicUrl(`downloads/${file.name}`).data.publicUrl
    }));

    res.json({ files: fileDetails, bucket: SUPABASE_BUCKET });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Optional: Delete file from Supabase
router.delete('/delete/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    
    const { error } = await supabase.storage
      .from(SUPABASE_BUCKET)
      .remove([`downloads/${filename}`]);

    if (error) throw error;

    res.json({ success: true, message: 'File deleted' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;