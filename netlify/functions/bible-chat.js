// netlify/functions/bible-chat.js
const Groq = require("groq-sdk");

exports.handler = async (event) => {
  try {
    // Check if API key is present
    if (!process.env.GROQ_API_KEY) {
      console.error("Missing GROQ_API_KEY environment variable");
      return {
        statusCode: 500,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ history: ["Error: Missing GROQ_API_KEY"] }),
      };
    }

    const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

    // Parse incoming request
    const body = JSON.parse(event.body || "{}");
    const userMessage = body.message || "Hello";

    // Call Groq API
    const response = await client.chat.completions.create({
      model: "llama3-8b-8192",
      messages: [{ role: "user", content: userMessage }],
    });

    // Extract answer
    const answer = response.choices?.[0]?.message?.content || "No answer received";

    // Return JSON response
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
