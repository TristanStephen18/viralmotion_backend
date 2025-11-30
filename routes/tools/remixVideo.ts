// import { Router, type Request, type Response } from 'express';
// import fs from 'fs';
// import path from 'path';
// import { fileURLToPath } from 'url';
// import crypto from 'crypto';
// import ffmpeg from 'fluent-ffmpeg';
// import axios from 'axios';

// const router = Router();

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// // ✅ Get PORT from environment or use default
// const PORT = process.env.PORT || 3000;
// const HOST = process.env.HOST || 'localhost';

// // ✅ CRITICAL: Use correct paths relative to compiled output
// const TEMP_DIR = path.join(process.cwd(), 'temp');
// const PROCESSED_DIR = path.join(process.cwd(), 'processed');

// console.log('📂 Directories configured:');
// console.log('   TEMP:', TEMP_DIR);
// console.log('   PROCESSED:', PROCESSED_DIR);

// // Create directories
// [TEMP_DIR, PROCESSED_DIR].forEach(dir => {
//   if (!fs.existsSync(dir)) {
//     fs.mkdirSync(dir, { recursive: true });
//     console.log(`📁 Created directory: ${dir}`);
//   }
// });

// // ✅ Check FFmpeg availability
// function checkFFmpeg(): Promise<boolean> {
//   return new Promise((resolve) => {
//     ffmpeg.getAvailableFormats((err) => {
//       if (err) {
//         console.error('❌ FFmpeg not available:', err.message);
//         resolve(false);
//       } else {
//         console.log('✅ FFmpeg is available');
//         resolve(true);
//       }
//     });
//   });
// }

// // Initialize FFmpeg check
// checkFFmpeg();

// // Download video with progress
// async function downloadVideo(url: string, outputPath: string): Promise<void> {
//   console.log(`📥 Downloading from: ${url}`);
  
//   try {
//     const response = await axios({
//       method: 'GET',
//       url,
//       responseType: 'stream',
//       timeout: 120000, // 2 minutes
//       maxContentLength: 500 * 1024 * 1024, // 500MB max
//       headers: {
//         'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
//       }
//     });

//     const totalSize = parseInt(response.headers['content-length'] || '0', 10);
//     let downloadedSize = 0;

//     const writer = fs.createWriteStream(outputPath);
    
//     response.data.on('data', (chunk: Buffer) => {
//       downloadedSize += chunk.length;
//       if (totalSize > 0) {
//         const percent = ((downloadedSize / totalSize) * 100).toFixed(1);
//         process.stdout.write(`\r📥 Downloading: ${percent}%`);
//       }
//     });

//     response.data.pipe(writer);

//     return new Promise((resolve, reject) => {
//       writer.on('finish', () => {
//         console.log(`\n✅ Downloaded to: ${outputPath}`);
//         const stats = fs.statSync(outputPath);
//         console.log(`📊 File size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
//         resolve();
//       });
//       writer.on('error', (err) => {
//         console.error('\n❌ Download error:', err);
//         reject(err);
//       });
//     });
//   } catch (error: any) {
//     console.error('❌ Download failed:', error.message);
//     throw new Error(`Failed to download video: ${error.message}`);
//   }
// }

// // Get duration
// function getVideoDuration(videoPath: string): Promise<number> {
//   return new Promise((resolve, reject) => {
//     ffmpeg.ffprobe(videoPath, (err, metadata) => {
//       if (err) {
//         console.error('❌ FFprobe error:', err);
//         reject(err);
//       } else {
//         const duration = metadata.format.duration || 0;
//         console.log(`⏱️ Video duration: ${duration.toFixed(2)}s`);
//         resolve(duration);
//       }
//     });
//   });
// }

// // Generate thumbnail
// function generateThumbnail(videoPath: string, outputPath: string): Promise<string> {
//   return new Promise((resolve, reject) => {
//     console.log(`📸 Generating thumbnail...`);
    
//     ffmpeg(videoPath)
//       .screenshots({
//         timestamps: ['50%'],
//         filename: path.basename(outputPath),
//         folder: path.dirname(outputPath),
//         size: '400x600'
//       })
//       .on('end', () => {
//         console.log(`✅ Thumbnail created: ${path.basename(outputPath)}`);
//         resolve(outputPath);
//       })
//       .on('error', (err) => {
//         console.error(`⚠️ Thumbnail error (non-critical):`, err.message);
//         resolve(''); // Don't reject - thumbnails are optional
//       });
//   });
// }

// // ✅ Helper: Generate caption text based on style
// function generateCaption(style: string, index: number): string {
//   const captions: Record<string, string[]> = {
//     viral: [
//       'WATCH THIS! 🔥',
//       'VIRAL ALERT! 🚨',
//       'TRENDING NOW! 💯',
//       'THIS IS CRAZY! 😱',
//       'MUST SEE! ⭐'
//     ],
//     meme: [
//       'LOL! 😂',
//       'WHEN YOU... 💀',
//       'POV: 🤣',
//       'RELATABLE! 😭',
//       'SO TRUE! 💯'
//     ],
//     educational: [
//       'LEARN THIS! 📚',
//       'DID YOU KNOW? 🧠',
//       'QUICK TIP! 💡',
//       'TUTORIAL! 🎓',
//       'LIFE HACK! ⚡'
//     ],
//     cinematic: [
//       'PURE ART 🎬',
//       'MASTERPIECE ✨',
//       'CINEMA 🎥',
//       'AESTHETIC 🌅',
//       'VISUAL ART 🎞️'
//     ],
//     funny: [
//       'HILARIOUS! 😂',
//       'TOO FUNNY! 🤣',
//       'COMEDY GOLD! ⭐',
//       'I CANT! 💀',
//       'IM DEAD! 😆'
//     ],
//     dramatic: [
//       'INTENSE! 🎭',
//       'EPIC MOMENT! ⚡',
//       'SHOCKING! 😮',
//       'DRAMATIC! 🔥',
//       'UNBELIEVABLE! 🌟'
//     ],
//   };

//   const styleCaptions = captions[style] || captions.viral;
//   return styleCaptions[index % styleCaptions.length];
// }

// // ✅ IMPROVED: Apply unique effects per variation
// function applyRemixEffects(
//   inputPath: string,
//   outputPath: string,
//   style: string,
//   duration: number,
//   effects: string[],
//   variationIndex: number
// ): Promise<string> {
//   return new Promise((resolve, reject) => {
//     const videoFilters: string[] = [];
    
//     // ✅ 1. STYLE-BASED COLOR GRADING
//     const styleMap: Record<string, string> = {
//       viral: 'eq=contrast=1.2:brightness=0.05:saturation=1.4',
//       meme: 'eq=saturation=2:contrast=1.5:brightness=0.1',
//       cinematic: 'eq=contrast=1.1:brightness=-0.05:saturation=0.8',
//       funny: 'eq=saturation=1.8:contrast=1.3:brightness=0.08',
//       dramatic: 'eq=contrast=1.4:brightness=-0.1:saturation=0.7',
//       educational: 'eq=contrast=1.05:brightness=0.02:saturation=1.0',
//     };
    
//     if (styleMap[style]) {
//       videoFilters.push(styleMap[style]);
//       console.log(`   🎨 Style: ${style}`);
//     }
    
//     // ✅ 2. ZOOM EFFECT - Varies by index
//     if (effects.includes('zoom')) {
//       const zoomLevels = [1.3, 1.5, 1.7, 1.4, 1.6];
//       const zoom = zoomLevels[variationIndex % zoomLevels.length];
//       const zoomSpeed = 0.001 + (variationIndex * 0.0003);
      
//       videoFilters.push(
//         `zoompan=z='min(zoom+${zoomSpeed},${zoom})':d=125:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=1080x1920`
//       );
//       console.log(`   🔍 Zoom: ${zoom}x (speed: ${zoomSpeed})`);
//     }
    
//     // ✅ 3. SPEED VARIATIONS
//     if (effects.includes('speedup')) {
//       const speeds = [1.0, 1.2, 1.5, 1.1, 1.3];
//       const speed = speeds[variationIndex % speeds.length];
      
//       if (speed !== 1.0) {
//         videoFilters.push(`setpts=PTS/${speed}`);
//         console.log(`   ⚡ Speed: ${speed}x`);
//       }
//     }
    
//     // ✅ 4. TRANSITIONS - Different timing per variation
//     if (effects.includes('transitions')) {
//       const fadeInDurations = [0.3, 0.5, 0.8, 0.4, 0.6];
//       const fadeOutDurations = [0.5, 0.8, 1.0, 0.6, 0.7];
      
//       const fadeIn = fadeInDurations[variationIndex % fadeInDurations.length];
//       const fadeOut = fadeOutDurations[variationIndex % fadeOutDurations.length];
      
//       videoFilters.push(
//         `fade=t=in:st=0:d=${fadeIn},fade=t=out:st=${duration - fadeOut}:d=${fadeOut}`
//       );
//       console.log(`   ✨ Transitions: ${fadeIn}s in, ${fadeOut}s out`);
//     }
    
//     // ✅ 5. VIGNETTE EFFECT - Varies by index
//     if (effects.includes('vignette') || variationIndex % 2 === 0) {
//       const vignetteStrengths = ['PI/4', 'PI/3', 'PI/5'];
//       const strength = vignetteStrengths[variationIndex % vignetteStrengths.length];
//       videoFilters.push(`vignette=${strength}`);
//       console.log(`   🎭 Vignette: ${strength}`);
//     }
    
//     // ✅ 6. MIRROR EFFECT on odd variations
//     if (effects.includes('mirror') && variationIndex % 2 === 1) {
//       videoFilters.push('hflip');
//       console.log(`   🪞 Mirror effect applied`);
//     }
    
//     // ✅ 7. CAPTIONS - Add text overlay at TOP
//     if (effects.includes('captions')) {
//       const caption = generateCaption(style, variationIndex);
      
//       // Caption positions - vary by index
//       const positions = [
//         'y=80',            // Top (80px from top)
//         'y=(h-text_h)/2',  // Middle
//         'y=h-150'          // Bottom (150px from bottom)
//       ];
//       const position = positions[variationIndex % positions.length];
      
//       // Font sizes - vary by index
//       const fontSizes = [70, 80, 90];
//       const fontSize = fontSizes[variationIndex % fontSizes.length];
      
//       // Escape caption text for FFmpeg
//       const escapedCaption = caption
//         .replace(/\\/g, '\\\\\\\\')
//         .replace(/'/g, "\\\\'")
//         .replace(/:/g, '\\\\:')
//         .replace(/,/g, '\\\\,')
//         .replace(/!/g, '\\\\!');
      
//       videoFilters.push(
//         `drawtext=text='${escapedCaption}':fontsize=${fontSize}:fontcolor=white:x=(w-text_w)/2:${position}:box=1:boxcolor=black@0.85:boxborderw=20:shadowcolor=black@0.6:shadowx=3:shadowy=3`
//       );
      
//       const positionName = position.includes('80') ? 'TOP' : position.includes('h-150') ? 'BOTTOM' : 'MIDDLE';
//       console.log(`   💬 Caption: "${caption}" at ${positionName} (size: ${fontSize}px)`);
//     }
    
//     // ✅ 8. SATURATION VARIATIONS
//     if (!styleMap[style]) {
//       const saturations = [1.0, 1.3, 1.6, 1.2, 1.4];
//       const sat = saturations[variationIndex % saturations.length];
//       videoFilters.push(`eq=saturation=${sat}`);
//       console.log(`   🌈 Saturation: ${sat}x`);
//     }
    
//     // ✅ 9. DIFFERENT START TIMES (creates different clips)
//     const startOffsets = [0, 2, 4, 1, 3];
//     const startTime = startOffsets[variationIndex % startOffsets.length];

//     console.log(`🎨 Total filters: ${videoFilters.length}`);
//     console.log(`⏰ Start offset: ${startTime}s`);

//     let command = ffmpeg(inputPath)
//       .setStartTime(startTime)
//       .setDuration(duration)
//       .videoCodec('libx264')
//       .audioCodec('aac')
//       .audioBitrate('128k')
//       .outputOptions([
//         '-preset fast',
//         '-crf 23',
//         '-movflags +faststart',
//         '-pix_fmt yuv420p',
//         '-profile:v baseline',
//         '-level 3.0'
//       ]);

//     if (videoFilters.length > 0) {
//       command = command.videoFilters(videoFilters);
//     }

//     let lastPercent = 0;
    
//     command
//       .output(outputPath)
//       .on('start', (cmd) => {
//         console.log(`▶️ Starting FFmpeg...`);
//         // console.log(`Command: ${cmd}`); // Uncomment for debugging
//       })
//       .on('progress', (progress) => {
//         if (progress.percent) {
//           const currentPercent = Math.round(progress.percent);
//           if (currentPercent > lastPercent && currentPercent % 10 === 0) {
//             console.log(`   ⏳ Progress: ${currentPercent}%`);
//             lastPercent = currentPercent;
//           }
//         }
//       })
//       .on('end', () => {
//         console.log(`   ✅ Processing complete`);
        
//         if (fs.existsSync(outputPath)) {
//           const stats = fs.statSync(outputPath);
//           const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
//           console.log(`   📊 Output size: ${sizeMB} MB`);
          
//           if (stats.size < 1000) {
//             reject(new Error('Output file is too small (possibly corrupted)'));
//           } else {
//             resolve(outputPath);
//           }
//         } else {
//           reject(new Error('Output file was not created'));
//         }
//       })
//       .on('error', (err) => {
//         console.error(`   ❌ FFmpeg error:`, err.message);
//         reject(err);
//       })
//       .run();
//   });
// }

// // ✅ Helper: Generate unique titles
// function generateTitle(style: string, index: number, effects: string[]): string {
//   const titles: Record<string, string[]> = {
//     viral: [
//       "This is INSANE! 🔥 #viral",
//       "Wait for it... 😱 #fyp",
//       "You won't believe this 👀",
//       "VIRAL ALERT 🚨 #trending",
//       "This blew my mind 🤯"
//     ],
//     meme: [
//       "When you realize... 😂",
//       "POV: This hits different 💀",
//       "Can't stop laughing 🤣",
//       "Relatable content 😭",
//       "This is too real 💯"
//     ],
//     educational: [
//       "Quick tip you need 📚",
//       "Did you know? 🧠",
//       "Here's how it works 💡",
//       "Learn this hack 🎓",
//       "Tutorial time! 📖"
//     ],
//     cinematic: [
//       "Pure art 🎬",
//       "Visual masterpiece ✨",
//       "This is cinema 🎥",
//       "Aesthetic vibes 🌅",
//       "Film quality 🎞️"
//     ],
//     funny: [
//       "Too good 😂",
//       "This killed me 💀",
//       "I can't 🤣",
//       "Comedy gold ⭐",
//       "Hilarious moment 😆"
//     ],
//     dramatic: [
//       "Most intense moment 🎭",
//       "You won't believe 😮",
//       "Everything changed 🔥",
//       "Epic moment ⚡",
//       "Dramatic reveal 🌟"
//     ],
//   };

//   const styleTitles = titles[style] || titles.viral;
//   return styleTitles[index % styleTitles.length];
// }

// // Main endpoint
// router.post('/remix-video', async (req: Request, res: Response) => {
//   const startTime = Date.now();
//   const { videoUrl, style, duration, variations, effects } = req.body;
  
//   console.log('\n🎬 ===== NEW REMIX REQUEST =====');
//   console.log('📦 Request:', { 
//     videoUrl: videoUrl?.substring(0, 60) + '...', 
//     style, 
//     duration, 
//     variations, 
//     effects 
//   });
  
//   // Validate inputs
//   if (!videoUrl) {
//     return res.status(400).json({ 
//       success: false,
//       error: 'Video URL required' 
//     });
//   }
  
//   const numVariations = Math.min(parseInt(variations) || 3, 5); // Max 5 variations
//   const targetDuration = Math.min(parseInt(duration) || 30, 60); // Max 60 seconds
  
//   const sessionId = crypto.randomBytes(8).toString('hex');
//   const remixes: any[] = [];
//   let originalPath = '';

//   try {
//     // Check FFmpeg availability first
//     const hasFFmpeg = await checkFFmpeg();
//     if (!hasFFmpeg) {
//       throw new Error('FFmpeg is not available on this server');
//     }

//     originalPath = path.join(TEMP_DIR, `${sessionId}-original.mp4`);
    
//     console.log('📥 Step 1: Downloading video...');
//     await downloadVideo(videoUrl, originalPath);
    
//     console.log('📊 Step 2: Analyzing video...');
//     const actualDuration = await getVideoDuration(originalPath);
//     const finalDuration = Math.min(targetDuration, Math.floor(actualDuration));
    
//     console.log(`⏱️ Will create ${numVariations} remixes of ${finalDuration}s each\n`);

//     for (let i = 0; i < numVariations; i++) {
//       console.log(`\n🔄 === VARIATION ${i + 1}/${numVariations} ===`);
      
//       const remixId = `${sessionId}-remix-${i}`;
//       const outputPath = path.join(PROCESSED_DIR, `${remixId}.mp4`);
//       const thumbnailPath = path.join(PROCESSED_DIR, `${remixId}-thumb.jpg`);
      
//       try {
//         // Process video with unique effects
//         console.log(`🎬 Processing video with unique effects...`);
//         await applyRemixEffects(
//           originalPath, 
//           outputPath, 
//           style, 
//           finalDuration, 
//           effects,
//           i
//         );
        
//         // Generate thumbnail (non-blocking)
//         const thumbUrl = await generateThumbnail(outputPath, thumbnailPath)
//           .then(() => `http://${HOST}:${PORT}/processed/${remixId}-thumb.jpg`)
//           .catch(() => null);
        
//         // Verify file
//         if (!fs.existsSync(outputPath)) {
//           throw new Error(`Output file not found: ${outputPath}`);
//         }
        
//         const fileSize = fs.statSync(outputPath).size;
//         console.log(`✅ Remix ${i + 1} completed: ${(fileSize / 1024 / 1024).toFixed(2)} MB`);
        
//         remixes.push({
//           id: remixId,
//           url: `http://${HOST}:${PORT}/processed/${remixId}.mp4`,
//           thumbnail: thumbUrl,
//           title: generateTitle(style, i, effects),
//           caption: generateCaption(style, i),
//           description: `Unique ${style} remix with ${effects.join(', ')}`,
//           duration: finalDuration,
//           effects,
//           style,
//         });
//       } catch (variationError: any) {
//         console.error(`❌ Failed to create variation ${i + 1}:`, variationError.message);
//         // Continue with other variations
//       }
//     }

//     // Clean up original
//     if (fs.existsSync(originalPath)) {
//       fs.unlinkSync(originalPath);
//       console.log('\n🗑️ Cleaned up original file');
//     }
    
//     if (remixes.length === 0) {
//       throw new Error('Failed to generate any remixes');
//     }
    
//     const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
//     console.log(`\n✅ ===== REMIX COMPLETE =====`);
//     console.log(`📊 Generated ${remixes.length}/${numVariations} remixes in ${totalTime}s`);
//     console.log(`🎯 Each variation has unique effects, timing, and styling`);
//     console.log(`==============================\n`);

//     res.json({ 
//       success: true, 
//       remixes, 
//       sessionId,
//       processingTime: totalTime,
//       message: `Generated ${remixes.length} unique variations with different effects`
//     });

//   } catch (error: any) {
//     console.error('\n❌ ===== REMIX FAILED =====');
//     console.error('Error:', error.message);
//     console.error('=============================\n');
    
//     // Clean up on error
//     try {
//       if (originalPath && fs.existsSync(originalPath)) {
//         fs.unlinkSync(originalPath);
//       }
      
//       // Clean up any partial files
//       const files = fs.readdirSync(PROCESSED_DIR);
//       files.forEach(file => {
//         if (file.includes(sessionId)) {
//           const filePath = path.join(PROCESSED_DIR, file);
//           fs.unlinkSync(filePath);
//           console.log(`🗑️ Cleaned up: ${file}`);
//         }
//       });
//     } catch (cleanupError) {
//       console.error('⚠️ Cleanup error:', cleanupError);
//     }

//     res.status(500).json({ 
//       success: false,
//       error: 'Failed to process video', 
//       details: error.message 
//     });
//   }
// });

// // Health check endpoint
// router.get('/remix-status', async (req: Request, res: Response) => {
//   const hasFFmpeg = await checkFFmpeg();
  
//   res.json({
//     status: 'ok',
//     ffmpeg: hasFFmpeg,
//     directories: {
//       temp: TEMP_DIR,
//       processed: PROCESSED_DIR,
//       tempExists: fs.existsSync(TEMP_DIR),
//       processedExists: fs.existsSync(PROCESSED_DIR)
//     },
//     baseUrl: `http://${HOST}:${PORT}`,
//     version: '2.0.0',
//     features: [
//       'Unique zoom levels per variation',
//       'Speed variations',
//       'Dynamic transitions',
//       'Style-based color grading',
//       'Vignette effects',
//       'Mirror effects',
//       'Different start times',
//       'Dynamic captions with positioning'
//     ]
//   });
// });

// // ✅ NEW: List processed videos
// router.get('/processed-videos', (req: Request, res: Response) => {
//   try {
//     const files = fs.readdirSync(PROCESSED_DIR);
//     const videos = files
//       .filter(f => f.endsWith('.mp4'))
//       .map(f => ({
//         filename: f,
//         url: `http://${HOST}:${PORT}/processed/${f}`,
//         size: fs.statSync(path.join(PROCESSED_DIR, f)).size,
//         created: fs.statSync(path.join(PROCESSED_DIR, f)).mtime
//       }));
    
//     res.json({
//       success: true,
//       count: videos.length,
//       videos
//     });
//   } catch (error: any) {
//     res.status(500).json({
//       success: false,
//       error: error.message
//     });
//   }
// });

// // ✅ NEW: Delete old processed videos (cleanup endpoint)
// router.delete('/cleanup-processed', (req: Request, res: Response) => {
//   try {
//     const files = fs.readdirSync(PROCESSED_DIR);
//     const now = Date.now();
//     const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    
//     let deletedCount = 0;
    
//     files.forEach(file => {
//       const filePath = path.join(PROCESSED_DIR, file);
//       const stats = fs.statSync(filePath);
//       const age = now - stats.mtime.getTime();
      
//       if (age > maxAge) {
//         fs.unlinkSync(filePath);
//         deletedCount++;
//         console.log(`🗑️ Deleted old file: ${file}`);
//       }
//     });
    
//     res.json({
//       success: true,
//       message: `Deleted ${deletedCount} old file(s)`,
//       deletedCount
//     });
//   } catch (error: any) {
//     res.status(500).json({
//       success: false,
//       error: error.message
//     });
//   }
// });

// export default router;