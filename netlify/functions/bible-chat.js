// v2.0 — Stable Netlify Classic Function

const Groq = require("groq-sdk");
const { getStore } = require("@netlify/blobs");

const client = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

exports.handler = async (event, context) => {
  const store = getStore("chat-history");

  try {
    // -------------------------
    // GET → return full history
    // -------------------------
    if (event.httpMethod === "GET") {
      const keys = await store.list();
      const history = [];

      for (const key of keys) {
        const item = await store.get(key);
        history.push(JSON.parse(item));
      }

      return {
        statusCode: 200,
        body: JSON.stringify({ history })
      };
    }

    // -------------------------
    // POST → process message
    // -------------------------
    if (event.httpMethod === "POST") {
      const body = JSON.parse(event.body || "{}");
      const message = body.message;

      if (!message) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: "No message provided." })
        };
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

      return {
        statusCode: 200,
        body: JSON.stringify({ history })
      };
    }

    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method not allowed." })
    };

  } catch (err) {
    console.error("bible-chat error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal server error." })
    };
  }
};
