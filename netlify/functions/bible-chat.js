import Groq from "groq-sdk";
import { getStore } from "@netlify/blobs";

const client = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

export default async (req, res) => {
  const store = getStore("chat-history");

  res.setHeader("Content-Type", "application/json");

  try {
    // -------------------------
    // GET → return full history
    // -------------------------
    if (req.method === "GET") {
      const keys = await store.list();
      const history = [];

      for (const key of keys) {
        const item = await store.get(key);
        history.push(JSON.parse(item));
      }

      return res.status(200).json({ history });
    }

    // -------------------------
    // POST → process message
    // -------------------------
    if (req.method === "POST") {
      const body = JSON.parse(req.body || "{}");
      const message = body.message;

      if (!message) {
        return res.status(400).json({ error: "No message provided." });
      }

      // Save user message
      const userEntry = {
        role: "user",
        text: message,
        timestamp: Date.now()
      };
      await store.setItem(`user-${Date.now()}`, JSON.stringify(userEntry));

      // Call Groq
      const completion = await client.chat.completions.create({
        model: "llama3-70b-8192",
        messages: [
          { role: "system", content: "You are The Shepherd, a Bible teacher." },
          { role: "user", content: message }
        ]
      });

      const replyText = completion.choices[0].message.content;

      // Save assistant reply
      const assistantEntry = {
        role: "assistant",
        text: replyText,
        timestamp: Date.now()
      };
      await store.setItem(`assistant-${Date.now()}`, JSON.stringify(assistantEntry));

      // Return full history
      const keys = await store.list();
      const history = [];
      for (const key of keys) {
        const item = await store.get(key);
        history.push(JSON.parse(item));
      }

      return res.status(200).json({ history });
    }

    return res.status(405).json({ error: "Method not allowed." });

  } catch (err) {
    console.error("bible-chat error:", err);
    return res.status(500).json({ error: "Internal server error." });
  }
};
