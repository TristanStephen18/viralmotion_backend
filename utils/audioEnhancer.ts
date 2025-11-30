import { AssemblyAI } from 'assemblyai';
import fetch from 'node-fetch';
import https from 'https';
import fs from 'fs';
import path from 'path';

const client = new AssemblyAI({
  apiKey: process.env.ASSEMBLYAI_API_KEY!
});

// ✅ Create HTTPS agent that ignores SSL errors (for development)
const httpsAgent = new https.Agent({
  rejectUnauthorized: false
});

export async function enhanceAudio(audioBuffer: Buffer) {
  console.log('📤 Uploading to AssemblyAI...');
  const uploadUrl = await client.files.upload(audioBuffer);
  console.log('✅ Upload complete:', uploadUrl);
  
  console.log('🎙️ Starting transcription...');
  const transcript = await client.transcripts.transcribe({
    audio: uploadUrl,
    speaker_labels: true,
    auto_highlights: true,
    language_detection: true,
  });

  if (transcript.status === 'error') {
    throw new Error('Enhancement failed');
  }

  console.log('✅ Transcription complete');

  // ✅ Download the audio from AssemblyAI with SSL bypass
  console.log('📥 Downloading enhanced audio from AssemblyAI...');
  
  const response = await fetch(uploadUrl, { 
    agent: httpsAgent 
  });

  if (!response.ok) {
    throw new Error(`Failed to download audio: ${response.statusText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Save to local downloads folder
  const filename = `enhanced-${Date.now()}.mp3`;
  const outputPath = path.join(process.cwd(), 'downloads', filename);
  
  const downloadsDir = path.join(process.cwd(), 'downloads');
  if (!fs.existsSync(downloadsDir)) {
    fs.mkdirSync(downloadsDir, { recursive: true });
  }

  fs.writeFileSync(outputPath, buffer);
  console.log('✅ Audio saved locally:', outputPath);

  // Return local URL (no CORS/SSL issues)
  const localUrl = `http://localhost:3000/downloads/${filename}`;

  return {
    audioUrl: localUrl,
    transcript: transcript.text,
    confidence: transcript.confidence,
  };
}