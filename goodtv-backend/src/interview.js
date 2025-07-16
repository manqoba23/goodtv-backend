const startBtn = document.getElementById("startBtn");
const log = document.getElementById("log");

let history = [
  {
    role: "system",
    content: "You're GoodTV's AI curator. Speak with emotional intelligence, cinematic warmth, and match the user's vibe when reflecting on film and culture.",
  },
];

function updateTranscript(text) {
  log.textContent += `\n${text}`;
  log.scrollTop = log.scrollHeight;
}

async function talkToAI(userInput) {
  updateTranscript(`You: ${userInput}`);
  history.push({ role: "user", content: userInput });

  try {
    // 🧠 Get AI text reply
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ history }),
    });

    const data = await response.json();
    const reply = data.reply;
    history.push({ role: "assistant", content: reply });
    updateTranscript(`Curator: ${reply}`);

    // 🎤 Optional: Detect emotional mood (stubbed for now)
    const mood = detectTone(userInput); // can be "melancholic", "joyful", etc.

    // 🗣️ Trigger ElevenLabs voice playback
    const voiceResponse = await fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: reply, mood }),
    });

    const voiceBlob = await voiceResponse.blob();
    const audio = new Audio(URL.createObjectURL(voiceBlob));
    audio.play();
  } catch (err) {
    updateTranscript("❌ Error connecting to curator.");
    console.error(err);
  }
}

// 🔍 Simple tone detection (stubbed — replace with classifier later)
function detectTone(text) {
  const lowered = text.toLowerCase();
  if (lowered.includes("sad") || lowered.includes("lonely")) return "melancholic";
  if (lowered.includes("excited") || lowered.includes("joy")) return "joyful";
  if (lowered.includes("weird") || lowered.includes("dream")) return "surreal";
  return "playful"; // default fallback
}

// 🎬 Launch demo interaction
startBtn.addEventListener("click", async () => {
  const userInput = prompt("What would you like to ask the curator?");
  if (userInput) {
    await talkToAI(userInput);
  }
});
