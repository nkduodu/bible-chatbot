// netlify/functions/bible-chat.js
const Groq = require("groq-sdk");

exports.handler = async (event) => {
  try {
    if (!process.env.GROQ_API_KEY) {
      return {
        statusCode: 500,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ history: ["Error: Missing GROQ_API_KEY"] }),
      };
    }

    const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

    const body = JSON.parse(event.body || "{}");
    const userMessage = body.message || "Hello";

    const response = await client.chat.completions.create({
      model: "llama-3.3-70b-versatile", // ✅ current supported model
      messages: [
        {
          role: "system",
          content:
            "You are a Bible study assistant. When asked about a passage, always explain that passage directly. Quote from it when relevant, summarize its meaning, and avoid greetings or unrelated verses.",
        },
        {
          role: "user",
          content: userMessage,
        },
      ],
    });

    const answer = response.choices?.[0]?.message?.content || "No answer received";

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ history: [answer] }),
    };
  } catch (error) {
    console.error("Groq error:", error);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ history: ["Error: Groq not responding"] }),
    };
  }

import { getStore } from "@netlify/blobs";

export default async (req, res) => {
  const store = getStore("chat-history"); // create or connect to a blob store
  const body = JSON.parse(req.body);
  const message = body.message;

  // Save user message
  await store.setItem(Date.now().toString(), JSON.stringify({
    role: "user",
    text: message
  }));

  // Call Groq (your existing logic)
  const reply = await getGroqResponse(message);

  // Save assistant reply
  await store.setItem(Date.now().toString(), JSON.stringify({
    role: "assistant",
    text: reply
  }));

  // Retrieve full history
  const keys = await store.list();
  const history = [];
  for (const key of keys) {
    const item = await store.get(key);
    history.push(JSON.parse(item));
  }

  res.json({ history });
};

