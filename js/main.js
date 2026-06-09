const messagesEl = document.getElementById("messages");
const inputEl = document.getElementById("input");
const sendBtn = document.getElementById("sendBtn");

const userId = "user-001";
const groupId = "group-001";

function addMessage(text, type) {
  const div = document.createElement("div");
  div.className = "bubble " + type;
  div.textContent = text;
  messagesEl.appendChild(div);
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

function speak(text) {
  try {
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = 1;
    speechSynthesis.speak(utter);
  } catch (e) {
    console.warn("Speech synthesis failed:", e);
  }
}

async function sendToBackend(question) {
  try {
    addMessage(question, "user");

    const res = await fetch("/.netlify/functions/bible-chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, groupId, question })
    });

    const data = await res.json();

    if (data.answer) {
      addMessage(data.answer, "bot");
      speak(data.answer);
    }

    if (data.songs && Array.isArray(data.songs)) {
      const lines = data.songs
        .map(song =>
          `${song.title} - ${song.artist}\nYouTube: ${song.youtube}\nSpotify: ${song.spotify}`
        )
        .join("\n\n");

      addMessage("Suggested hymns & songs:\n\n" + lines, "bot");
    }

  } catch (err) {
    console.error("Backend error:", err);
    addMessage("Sorry, something went wrong.", "bot");
  }
}

async function loadHistory() {
  try {
    const res = await fetch("/.netlify/functions/bible-chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, groupId, loadHistory: true })
    });

    const data = await res.json();
    messagesEl.innerHTML = "";

    const history = data.history || data.messages || [];

    history.forEach(msg => {
      const role = msg.role === "user" ? "user" : "bot";
      if (msg.text) addMessage(msg.text, role);
    });

    if (data.songs && Array.isArray(data.songs)) {
      const lines = data.songs
        .map(song =>
          `${song.title} - ${song.artist}\nYouTube: ${song.youtube}\nSpotify: ${song.spotify}`
        )
        .join("\n\n");

      addMessage("Suggested hymns & songs:\n\n" + lines, "bot");
    }

  } catch (err) {
    console.error("History load failed:", err);
  }
}

sendBtn.addEventListener("click", () => {
  const text = inputEl.value.trim();
  if (!text) return;
  inputEl.value = "";
  sendToBackend(text);
});

inputEl.addEventListener("keydown", e => {
  if (e.key === "Enter") {
    const text = inputEl.value.trim();
    if (!text) return;
    inputEl.value = "";
    sendToBackend(text);
  }
});

loadHistory();
