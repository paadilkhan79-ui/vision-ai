
const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" }));

const PORT = process.env.PORT || 3000;
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const VISION_ACCESS_KEY = process.env.VISION_ACCESS_KEY;
const DEFAULT_MODEL = process.env.GROQ_MODEL || "openai/gpt-oss-120b";

app.get("/", (_req, res) => {
  res.send("VISION AI Groq Server is running!");
});

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok", service: "VISION AI" });
});

app.post("/chat", async (req, res) => {
  try {
    // Access key check
    const providedKey = req.header("x-vision-access-key");

    if (!VISION_ACCESS_KEY || providedKey !== VISION_ACCESS_KEY) {
      return res.status(401).json({ error: "Access denied" });
    }

    if (!GROQ_API_KEY) {
      return res.status(500).json({ error: "GROQ_API_KEY missing" });
    }

    const { message, prompt, messages, model, temperature, max_tokens } =
      req.body || {};

    // Support old VISION app format
    let formattedMessages;

    if (Array.isArray(messages) && messages.length > 0) {
      formattedMessages = messages;
    } else {
      const text = typeof message === "string" ? message : prompt;

      if (typeof text !== "string" || !text.trim()) {
        return res.status(400).json({ error: "Message required" });
      }

      formattedMessages = [
        { role: "user", content: text.trim() }
      ];
    }

    const selectedModel =
      typeof model === "string" && model.trim()
        ? model.trim()
        : DEFAULT_MODEL;

    const payload = {
      model: selectedModel,
      messages: formattedMessages
    };

    if (typeof temperature === "number") {
      payload.temperature = temperature;
    }

    if (typeof max_tokens === "number") {
      payload.max_tokens = max_tokens;
    }

    const groqResponse = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: "Bearer " + GROQ_API_KEY,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(60000)
      }
    );

    const data = await groqResponse.json();

    if (!groqResponse.ok) {
      console.error("Groq error:", data);
      return res.status(groqResponse.status).json({
        error: data.error?.message || "Groq request failed"
      });
    }

    const reply =
      data.choices?.[0]?.message?.content || "No response";

    // Compatible with the old VISION app
    return res.status(200).json({ reply });

  } catch (err) {
    console.error("Server error:", err.message);

    if (err.name === "TimeoutError" || err.name === "AbortError") {
      return res.status(504).json({ error: "AI request timed out" });
    }

    return res.status(502).json({ error: "Server error" });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log("VISION AI server running on port " + PORT);
});
                         
