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

    // ✅ Updated to a supported model
    const response = await client.chat.completions.create({
      model: "llama3-70b-8192",
      messages: [{ role: "user", content: userMessage }],
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
};
