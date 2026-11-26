const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("VISION AI Server is running!");
});

app.get("/health", (req, res) => {
  res.json({ status: "ok", app: "VISION AI" });
});

app.post("/chat", async (req, res) => {
  try {
    const accessKey = req.headers["x-vision-access-key"];

    if (
      !process.env.VISION_ACCESS_KEY ||
      accessKey !== process.env.VISION_ACCESS_KEY
    ) {
      return res.status(401).json({ error: "Access denied" });
    }

    const message = req.body.message;

    if (!message) {
      return res.status(400).json({ error: "Message required" });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: "AI key not configured" });
    }

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + apiKey,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: message }] }]
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Gemini error:", data);
      return res.status(500).json({ error: "AI request failed" });
    }

    const reply =
      data.candidates?.[0]?.content?.parts?.[0]?.text || "No response";

    res.json({ reply });

  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("VISION AI server running on port " + PORT);
});
