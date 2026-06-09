// netlify/functions/bible-chat.js
const Groq = require("groq-sdk");

const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

exports.handler = async (event) => {
  try {
    // Parse incoming request body
    const body = JSON.parse(event.body || "{}");
    const userMessage = body.message || "Hello";

    // Call Groq API
    const response = await client.chat.completions.create({
      model: "llama3-8b-8192",
      messages: [{ role: "user", content: userMessage }],
    });

    // Extract answer
    const answer = response.choices[0]?.message?.content || "No answer";

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
