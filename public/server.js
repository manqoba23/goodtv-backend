const express = require('express');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

// 🔁 Respond to chat message
app.post('/chat', (req, res) => {
  const { history } = req.body;
  const reply = "What's a movie you loved recently?";
  res.json({ reply });
});

// 🧾 Store final profile
app.post('/webhook/voice-response', (req, res) => {
  console.log("✅ Profile received:", req.body);
  res.send({ status: "OK" });
});

// 🚀 Start the server
app.listen(3000, () => {
  console.log("🧠 Server running on http://localhost:3000");
});
