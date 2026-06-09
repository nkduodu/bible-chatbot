const Groq = require("groq-sdk");

exports.handler = async (event, context) => {
  try {
    const body = JSON.parse(event.body || "{}");
    const { userId, groupId, question, loadHistory } = body;

    global.chatHistory = global.chatHistory || {};
    const key = `${userId}-${groupId}`;
    global.chatHistory[key] = global.chatHistory[key] || [];

    if (loadHistory) {
      return {
        statusCode: 200,
        body: JSON.stringify({ history: global.chatHistory[key] })
      };
    }

    global.chatHistory[key].push({ role: "user", text: question });

    const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

    const completion = await client.chat.completions.create({
      model: "llama3-8b-8192",
      messages: [
        { role: "system", content: "You are a Bible study assistant." },
        { role: "user", content: question }
      ]
    });

    const answer = completion.choices[0].message.content;

    global.chatHistory[key].push({ role: "assistant", text: answer });

    return {
      statusCode: 200,
      body: JSON.stringify({
        answer,
        songs: [
          {
            title: "Amazing Grace",
            artist: "John Newton",
            youtube: "https://youtube.com",
            spotify: "https://spotify.com"
          }
        ]
      })
    };

  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};
