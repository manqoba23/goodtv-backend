// 🎬 GOODTV Voice Interview Logic
const startBtn = document.getElementById("startBtn");
const log = document.getElementById("log");

// 🧠 Display transcript updates
const updateTranscript = (text) => {
  log.textContent += `\n${text}`;
  log.scrollTop = log.scrollHeight; // Auto-scroll for new lines
};

// 📡 Send user input to AI backend
const talkToAI = async (message) => {
  updateTranscript(`You: ${message}`);
  try {
    const res = await fetch("http://localhost:3000/chat", {
      method: "POST",
      mode: "cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        history: [{ role: "user", content: message }]
      })
    });

    if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);

    const data = await res.json();
    updateTranscript(`AI: ${data.reply}`);
  } catch (err) {
    updateTranscript("❌ Connection error. Curator unreachable.");
    console.error("🛠️ Backend fetch failed:", err);
  }
};

// 🎤 Mic setup via Web Speech API
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

if (!SpeechRecognition) {
  updateTranscript("❌ Browser doesn't support voice recognition.");
} else {
  const recognition = new SpeechRecognition();
  recognition.lang = "en-US";
  recognition.interimResults = false;
  recognition.continuous = false;

  recognition.onstart = () => updateTranscript("🎙️ Listening...");
  recognition.onerror = (event) => updateTranscript(`❌ Mic error: ${event.error}`);
  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript.trim();
    talkToAI(transcript);
  };

  startBtn.addEventListener("click", () => recognition.start());
}
