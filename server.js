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

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("VISION AI server running on port " + PORT);
});
