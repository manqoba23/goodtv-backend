const startBtn = document.getElementById("startBtn");
const log = document.getElementById("log");

// 🧠 Update transcript visually
function updateTranscript(text) {
  log.textContent += `\n${text}`;
}

// 🧠 Talk to AI via backend
async function talkToAI(userInput) {
  updateTranscript(`You: ${userInput}`);
  try {
    const response = await fetch("http://10.0.0.104:3000/chat", {
      method: "POST",
      mode: "cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        history: [{ role: "user", content: userInput }]
      })
    });
    const data = await response.json();
    updateTranscript(`AI: ${data.reply}`);
  } catch (err) {
    updateTranscript("❌ Error contacting curator.");
    console.error(err);
  }
}

// 🎤 Mic setup using Web Speech API
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = new SpeechRecognition();
recognition.lang = "en-US";
recognition.interimResults = false;
recognition.continuous = false;

startBtn.addEventListener("click", () => {
  updateTranscript("🎙️ Listening...");
  recognition.start();
});

recognition.onresult = (event) => {
  const userInput = event.results[0][0].transcript;
  talkToAI(userInput);
};

recognition.onerror = (event) => {
  updateTranscript(`❌ Mic error: ${event.error}`);
};
