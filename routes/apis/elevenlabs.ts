// src/server.ts
import { Router } from "express";
import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import * as dotenv from "dotenv";
import fs from "fs";
import path from "path";
import os from "os";
import {
  updatechatsJsonfile,
  updateRedditScriptJson,
  updateStoryTellingScriptJson,
} from "../../controllers/functions/jsonupdater.ts";
import { getAudioDurationInSeconds } from "get-audio-duration";
import { supabase, SUPABASE_BUCKET } from "../../utils/supabaseClient.ts";

dotenv.config();
const router = Router();

const elevenLabs = new ElevenLabsClient({
  apiKey: process.env.ELEVEN_LABS_API_KEY,
});

async function webStreamToBuffer(webStream: ReadableStream<Uint8Array>): Promise<Buffer> {
  const reader = webStream.getReader();
  const chunks: Uint8Array[] = [];

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }

  return Buffer.concat(chunks.map((c) => Buffer.from(c)));
}


async function uploadToSupabase(filePath: string, remotePath: string) {
  const fileBuffer = fs.readFileSync(filePath);
  const { data, error } = await supabase.storage
    .from(SUPABASE_BUCKET)
    .upload(remotePath, fileBuffer, {
      contentType: "audio/mpeg",
      upsert: true,
    });

  if (error) {
    console.error("❌ Supabase upload failed:", error.message);
    throw error;
  }

  const { data: publicUrlData } = supabase.storage
    .from(SUPABASE_BUCKET)
    .getPublicUrl(remotePath);

  return publicUrlData.publicUrl;
}

router.post("/test-generate", async (req, res) => {
  console.log(req.body.chats);
  try {
    const voices: string[] = req.body.voices || [
      "EXAVITQu4vr4xnSDxMaL",
      "XrExE9yKIg1WjnnlVkGX",
    ];

    const chats: { speaker: string; text: string }[] = req.body.chats || [
      { speaker: "person_1", text: "Hey, have you tried The Green Fork yet?" },
      { speaker: "person_2", text: "Not yet. Is it any good?" },
    ];

    if (!Array.isArray(chats) || chats.length === 0) {
      return res.status(400).json({ error: "No chats provided" });
    }

    // 🔑 Map speakers to voices
    const speakerToVoice: Record<string, string> = {};
    let nextVoiceIndex = 0;
    function getVoiceForSpeaker(speaker: string) {
      if (!speakerToVoice[speaker]) {
        speakerToVoice[speaker] = voices[nextVoiceIndex % voices.length];
        nextVoiceIndex++;
      }
      return speakerToVoice[speaker];
    }

    const audioBuffers: Buffer[] = [];
    const segments: any[] = [];
    let currentTime = 0;

    // 🔊 Generate TTS for each chat
    for (let i = 0; i < chats.length; i++) {
      const { text, speaker } = chats[i];
      const voiceId = getVoiceForSpeaker(speaker);

      console.log("🎤 Generating voiceover...", {
        voiceId,
        speaker,
        preview: text.slice(0, 80),
      });

      const audioStream = await elevenLabs.textToSpeech.convert(
        voiceId,
        {
        modelId: "eleven_multilingual_v2",
        text,
      });

      const buffer = await webStreamToBuffer(audioStream);
      audioBuffers.push(buffer);

      // Temporary file to get duration
      const tmpFile = path.join(
        os.tmpdir(),
        `utterance-${i}-${Date.now()}.mp3`
      );
      fs.writeFileSync(tmpFile, buffer);
      const dur = await getAudioDurationInSeconds(tmpFile);
      fs.unlinkSync(tmpFile); // cleanup temp file

      segments.push({
        text,
        start_time: currentTime,
        end_time: currentTime + dur,
        speaker: {
          id: speaker,
          name: speaker.replace("_", " "),
        },
      });

      currentTime += dur;
    }

    // 🔊 Combine all buffers
    const finalAudio = Buffer.concat(audioBuffers);
    const fileName = `fakeconvo-${Date.now()}.mp3`;
    const remotePath = `audios/fakeconvo/${fileName}`;

    // ☁️ Upload final audio to Supabase
    const { data, error } = await supabase.storage
      .from(SUPABASE_BUCKET)
      .upload(remotePath, finalAudio, {
        contentType: "audio/mpeg",
        upsert: true,
      });

    if (error) {
      console.error("❌ Supabase upload failed:", error.message);
      return res.status(500).json({ error: "Supabase upload failed" });
    }

    // 🌐 Get public URL
    const { data: publicUrlData } = supabase.storage
      .from(SUPABASE_BUCKET)
      .getPublicUrl(remotePath);

    const publicUrl = publicUrlData.publicUrl;
    console.log("✅ Uploaded to Supabase:", publicUrl);

    // ⏱️ Duration of the full audio
    const tmpFinal = path.join(os.tmpdir(), `final-${Date.now()}.mp3`);
    fs.writeFileSync(tmpFinal, finalAudio);
    const duration = await getAudioDurationInSeconds(tmpFinal);
    fs.unlinkSync(tmpFinal);

    // 📦 Build chats JSON
    const chatsjson = {
      language_code: "eng",
      segments,
    };

    updatechatsJsonfile(chatsjson);

    // ✅ Send response
    res.json({
      language_code: "eng",
      audioUrl: publicUrl,
      segments,
      duration: duration + 1,
    });
  } catch (err) {
    console.error("Generation error:", err);
    res.status(500).json({
      error: "Failed to generate conversation",
      details: String(err),
    });
  }
});

router.post("/reddit", async (req, res) => {
  console.log("template updating");
  try {
    const { title, textcontent, voiceid } = req.body;

    if (!title || !textcontent || !voiceid) {
      return res.status(400).json({
        error: "Missing required fields: title, textcontent, voiceid",
      });
    }

    const endsWithPunct = /[.!?]$/.test(title.trim());
    const story = endsWithPunct
      ? `${title.trim()} ${textcontent.trim()}`
      : `${title.trim()}. ${textcontent.trim()}`;

    console.log("🎤 Generating single TTS...", {
      title,
      voiceid,
      preview: story.slice(0, 80),
    });

    // 🔊 Generate TTS from ElevenLabs
    const audioStream = await elevenLabs.textToSpeech.convert(
      voiceid,
      {
      modelId: "eleven_multilingual_v2",
      text: story,
    });

    // Convert stream → buffer
    const buffer = await webStreamToBuffer(audioStream);

    // 🔼 Upload to Supabase directly (no local save)
    const fileName = `reddit-${Date.now()}.mp3`;
    const remotePath = `audios/reddit/${fileName}`;

    const { data, error } = await supabase.storage
      .from(SUPABASE_BUCKET)
      .upload(remotePath, buffer, {
        contentType: "audio/mpeg",
        upsert: true,
      });

    if (error) {
      console.error("❌ Supabase upload failed:", error.message);
      return res.status(500).json({ error: "Supabase upload failed" });
    }

    // 🔗 Get public URL
    const { data: publicData } = supabase.storage
      .from(SUPABASE_BUCKET)
      .getPublicUrl(remotePath);
    const publicUrl = publicData.publicUrl;

    console.log("✅ Uploaded to Supabase:", publicUrl);

    // ⚡ You can still do forced alignment using the buffer
    const tempPath = path.join(os.tmpdir(), fileName);
    fs.writeFileSync(tempPath, buffer);
    const duration = await getAudioDurationInSeconds(tempPath);

    const alignment = await elevenLabs.forcedAlignment.create({
      file: fs.createReadStream(tempPath),
      text: story,
    });

    const words = alignment.words.map((w: any) => ({
      word: w.text,
      start: w.start,
      end: w.end,
    }));

    const script = {
      story,
      duration,
      words,
      title,
      text: textcontent,
    };

    updateRedditScriptJson(script);

    res.json({
      script,
      duration,
      audioUrl: publicUrl, // ✅ URL from Supabase
    });
  } catch (err) {
    console.error("Single TTS + alignment error:", err);
    res.status(500).json({
      error: "Failed to generate single TTS with alignment",
      details: String(err),
    });
  }
});

router.post("/story", async (req, res) => {
  console.log("template updating");
  try {
    const { content, voiceid } = req.body;

    if (!content || !voiceid) {
      return res.status(400).json({
        error: "Missing required fields: content or voiceid",
      });
    }

    console.log("🎤 Generating single TTS...", {
      voiceid,
      preview: content.slice(0, 80),
    });

    // 🔊 Generate TTS from ElevenLabs
    const audioStream = await elevenLabs.textToSpeech.convert(
      voiceid,
      {
      modelId: "eleven_multilingual_v2",
      text: content,
    });

    // Convert stream → buffer
    const buffer = await webStreamToBuffer(audioStream);

    // 📦 Upload directly to Supabase
    const fileName = `story-${Date.now()}.mp3`;
    const remotePath = `audios/story/${fileName}`;

    const { data, error } = await supabase.storage
      .from(SUPABASE_BUCKET)
      .upload(remotePath, buffer, {
        contentType: "audio/mpeg",
        upsert: true,
      });

    if (error) {
      console.error("❌ Supabase upload failed:", error.message);
      return res.status(500).json({ error: "Supabase upload failed" });
    }

    // 🌐 Get public URL from Supabase
    const { data: publicData } = supabase.storage
      .from(SUPABASE_BUCKET)
      .getPublicUrl(remotePath);
    const publicUrl = publicData.publicUrl;

    console.log("✅ Uploaded to Supabase:", publicUrl);

    // ⏱️ Write to temp file for duration + alignment
    const tmpPath = path.join(os.tmpdir(), fileName);
    fs.writeFileSync(tmpPath, buffer);

    const duration = await getAudioDurationInSeconds(tmpPath);

    console.log("📐 Performing forced alignment...");
    const alignment = await elevenLabs.forcedAlignment.create({
      file: fs.createReadStream(tmpPath),
      text: content,
    });
    console.log("✅ Alignment received");

    // 🧩 Format alignment data
    const words = alignment.words.map((w: any) => ({
      word: w.text,
      start: w.start,
      end: w.end,
    }));

    const script = {
      story: content,
      duration,
      words,
    };

    // 📝 Update your story JSON
    updateStoryTellingScriptJson(script);

    // 🧹 Optional cleanup (delete temp file)
    fs.unlinkSync(tmpPath);

    // ✅ Respond with Supabase URL
    res.json({
      script,
      duration,
      audioUrl: publicUrl,
    });
  } catch (err) {
    console.error("Single TTS + alignment error:", err);
    res.status(500).json({
      error: "Failed to generate single TTS with alignment",
      details: String(err),
    });
  }
});
// Add this route to your existing elevenlabs router
router.post("/generate-voiceover", async (req, res) => {
  console.log('\n📨 ElevenLabs Voiceover request received');
  console.log('Time:', new Date().toISOString());
  
  try {
    const { text, voice, speed } = req.body;
    
    // Validation
    if (!text || !voice) {
      console.log('❌ Missing required fields');
      return res.status(400).json({ 
        error: 'Missing required fields: text, voice' 
      });
    }

    if (!process.env.ELEVEN_LABS_API_KEY) {
      console.error('❌ ELEVEN_LABS_API_KEY not set');
      return res.status(500).json({ 
        error: 'Server configuration error' 
      });
    }

    console.log('✅ Validation passed');
    console.log('📝 Text length:', text.length);
    console.log('🎤 Voice:', voice);
    console.log('⚡ Speed:', speed);

    // Map OpenAI voice names to ElevenLabs voice IDs
    const VOICE_MAP: Record<string, string> = {
      'alloy': 'EXAVITQu4vr4xnSDxMaL',      // Bella (neutral)
      'echo': 'pNInz6obpgDQGcFmaJgB',       // Adam (male)
      'fable': 'N2lVS1w4EtoT3dr4eOWO',      // Callum (male)
      'onyx': 'VR6AewLTigWG4xSOukaG',       // Arnold (deep male)
      'nova': 'EXAVITQu4vr4xnSDxMaL',       // Bella (female)
      'shimmer': 'ThT5KcBeYPX3keUQqHPh',    // Dorothy (soft female)
    };
    
    const voiceId = VOICE_MAP[voice] || VOICE_MAP['alloy'];
    console.log('🎭 Using ElevenLabs Voice ID:', voiceId);
    
    console.log('🌐 Calling ElevenLabs TTS API...');
    
    // Generate audio using your existing ElevenLabs client
    const audioStream = await elevenLabs.textToSpeech.convert(
      voiceId,
      {
        modelId: "eleven_multilingual_v2",
        text: text,
      }
    );

    console.log('✅ Converting stream to buffer...');
    const buffer = await webStreamToBuffer(audioStream);
    console.log('✅ Audio size:', buffer.byteLength, 'bytes');

    // Send audio directly
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Length', buffer.byteLength.toString());
    res.send(buffer);
    
    console.log('✅ Audio sent successfully\n');
    
  } catch (error) {
    console.error('❌ SERVER ERROR:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ 
      error: 'Server error',
      details: errorMessage
    });
  }
});

export default router;
