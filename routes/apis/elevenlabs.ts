// src/server.ts
import { Router } from "express";
import { ElevenLabsClient } from "elevenlabs";
import * as dotenv from "dotenv";
import fs from "fs";
import path from "path";
import os from "os";
import { Readable } from "stream";
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
  apiKey: process.env.ELEVEN_LABS_API_KEY!,
});

async function streamToBuffer(stream: Readable): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
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

      const audioStream = await elevenLabs.generate({
        voice: voiceId,
        model_id: "eleven_multilingual_v2",
        text,
      });

      const buffer = await streamToBuffer(audioStream as Readable);
      audioBuffers.push(buffer);

      // Temporary file to get duration
      const tmpFile = path.join(os.tmpdir(), `utterance-${i}-${Date.now()}.mp3`);
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
    const audioStream = await elevenLabs.generate({
      voice: voiceid,
      model_id: "eleven_multilingual_v2",
      text: story,
    });

    // Convert stream → buffer
    const buffer = await streamToBuffer(audioStream as Readable);

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
    const audioStream = await elevenLabs.generate({
      voice: voiceid,
      model_id: "eleven_multilingual_v2",
      text: content,
    });

    // Convert stream → buffer
    const buffer = await streamToBuffer(audioStream as Readable);

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

export default router;
