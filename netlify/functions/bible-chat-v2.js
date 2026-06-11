const { getStore } = require("@netlify/blobs");
const fetch = require("node-fetch");

exports.handler = async (event, context) => {
  // Initialize Blobs store (manual mode)
  const store = getStore("chat-history", {
    siteID: process.env.NETLIFY_SITE_ID,
    token: process.env.NETLIFY_API_TOKEN
  });

  try {
    // ------------------------
    // GET -> return full history
    // ------------------------
    if (event.httpMethod === "GET") {
      const { blobs } = await store.list();   // FIXED: new API returns { blobs: [...] }
      const history = [];

      for (const blob of blobs) {
        const item = await store.get(blob.key);
        history.push(JSON.parse(item));
      }

      return {
        statusCode: 200,
        body: JSON.stringify({ history })
      };
    }

    // ------------------------
    // POST -> process message
    // ------------------------
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
        content: message,
        timestamp: Date.now()
      };

      await store.set(`user-${Date.now()}`, JSON.stringify(userEntry));

      // ------------------------
      // CALL GROQ API
      // ------------------------
      const groqKey = process.env.GROQ_API_KEY;

      const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${groqKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "llama3-8b-8192",
          messages: [
            { role: "system", content: "You are MyShepherd, a Bible-based assistant." },
            { role: "user", content: message }
          ]
        })
      });

      const groqData = await groqResponse.json();

      if (!groqData.choices || !groqData.choices[0]) {
        return {
          statusCode: 500,
          body: JSON.stringify({ error: "GROQ response invalid." })
        };
      }

      const aiReply = groqData.choices[0].message.content;

      // Save AI reply
      const aiEntry = {
        role: "assistant",
        content: aiReply,
        timestamp: Date.now()
      };

      await store.set(`assistant-${Date.now()}`, JSON.stringify(aiEntry));

      return {
        statusCode: 200,
        body: JSON.stringify({ reply: aiReply })
      };
    }

    // ------------------------
    // Unsupported method
    // ------------------------
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method not allowed." })
    };

  } catch (err) {
    console.error("Function error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal server error." })
    };
  }
};
