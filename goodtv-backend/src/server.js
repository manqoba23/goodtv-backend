const express = require("express");
const cors = require("cors");
const axios = require("axios");
const path = require("path");
const { ElevenLabsClient } = require("@elevenlabs/elevenlabs-js");
const cloudinary = require("cloudinary").v2;
const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json({ limit: "25mb" }));

// 🌐 Serve Curator UI
app.use(express.static(path.join(__dirname, "..", "public")));
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "index.html"));
});

// 🔐 Env Keys
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const ELEVENLABS_VOICE_ID = process.env.ELEVENLABS_VOICE_ID;
const ASSEMBLY_API_KEY = process.env.ASSEMBLY_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
const CLOUD_API_KEY = process.env.CLOUDINARY_API_KEY;
const CLOUD_API_SECRET = process.env.CLOUDINARY_API_SECRET;

// 🌩️ Cloudinary Config
cloudinary.config({
  cloud_name: CLOUD_NAME,
  api_key: CLOUD_API_KEY,
  api_secret: CLOUD_API_SECRET
});

// 🧠 ElevenLabs & Gemini Setup
const elevenlabs = new ElevenLabsClient({ apiKey: ELEVENLABS_API_KEY });
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// 📜 System Prompt
const SYSTEM_PROMPT = `
You are the voice-first curator of GOODTV — a cinematic, emotionally intelligent companion who connects users through film, feeling, and culture. You respond with emotional warmth, stylistic flair, and thoughtful insights.
`;

// 🎙️ Upload Audio
app.post("/api/upload-audio", async (req, res) => {
  try {
    const { audioBase64 } = req.body;
    if (!audioBase64) return res.status(400).json({ error: "Missing audio data" });

    const result = await cloudinary.uploader.upload(audioBase64, {
      resource_type: "video",
      folder: "goodtv-voice"
    });

    res.json({ audioUrl: result.secure_url });
  } catch (e) {
    console.error("Cloudinary error:", e.message);
    res.status(500).json({ error: "Upload failed" });
  }
});

// 🎧 Transcription
app.post("/api/transcribe", async (req, res) => {
  try {
    const { audioUrl } = req.body;
    if (!audioUrl) return res.status(400).json({ error: "Missing audio URL" });

    const response = await axios.post(
      "https://api.assemblyai.com/v2/transcript",
      { audio_url: audioUrl },
      {
        headers: {
          authorization: ASSEMBLY_API_KEY,
          "content-type": "application/json"
        }
      }
    );

    res.json({ text: response.data.text });
  } catch (e) {
    console.error("AssemblyAI error:", e.message);
    res.status(500).json({ error: "Transcription failed" });
  }
});

// 🧠 Gemini Chat
app.post("/api/chat", async (req, res) => {
  try {
    const userMessage = req.body?.history?.slice(-1)[0]?.content || "";
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const result = await model.generateContent([
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userMessage }
    ]);

    const reply = result.response.text();
    res.json({ reply });
  } catch (e) {
    console.error("Gemini error:", e.message);
    res.status(500).json({ error: "Gemini failed" });
  }
});

// 🗣️ ElevenLabs TTS
app.post("/api/tts", async (req, res) => {
  try {
    const { text, mood } = req.body;
    if (!text) return res.status(400).json({ error: "Missing text input" });

    const tonePresets = {
      joyful: 1.3,
      melancholic: 0.95,
      surreal: 1.0,
      playful: 1.2
    };
    const voiceSpeed = tonePresets[mood] || 1.1;

    const audioBuffer = await elevenlabs.textToSpeech.convert({
      voiceId: ELEVENLABS_VOICE_ID,
      text,
      modelId: "eleven_multilingual_v2",
      voiceSettings: {
        stability: 0.3,
        similarityBoost: 0.75,
        speed: voiceSpeed
      },
      outputFormat: "mp3"
    });

    res.setHeader("Content-Type", "audio/mpeg");
    res.send(audioBuffer);
  } catch (e) {
    console.error("ElevenLabs error:", e.message);
    res.status(500).json({ error: "Voice generation failed" });
  }
});

// 🟣 Startup Debug Message
console.log("👀 Server script has started...");

// 🚀 Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🎬 GOODTV Curator backend running at http://localhost:${PORT}`);
});
