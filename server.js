
const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("VISION AI Groq Server is running!");
});

app.get("/health", (req, res) => {
  res.json({ status: "ok", app: "VISION AI" });
});

app.post("/chat", async (req, res) => {
  try {
    const accessKey = req.headers["x-vision-access-key"];

    if (!process.env.VISION_ACCESS_KEY ||
        accessKey !== process.env.VISION_ACCESS_KEY) {
      return res.status(401).json({ error: "Access denied" });
    }

    const message = req.body.message;
    if (!message) {
      return res.status(400).json({ error: "Message required" });
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "Groq key missing" });
    }

    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + apiKey
        },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant",
          messages: [
            { role: "user", content: message }
          ],
          temperature: 0.7
        }),
        signal: AbortSignal.timeout(60000)
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Groq error:", data);
      return res.status(500).json({
        error: data.error?.message || "Groq request failed"
      });
    }

    const reply =
      data.choices?.[0]?.message?.content || "No response";

    res.json({ reply });

  } catch (error) {
    console.error("Server error:", error.message);
    res.status(500).json({ error: "Server error" });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("VISION AI Groq server running on port " + PORT);
});
              
