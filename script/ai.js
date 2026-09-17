const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

module.exports = {
  config: {
    name: "gemini",
    version: "1.0.0",
    hasPermission: 0,
    credits: "You",
    description: "Makipag-usap sa Gemini AI sa GC",
    commandCategory: "ai",
    usages: "[tanong]",
    cooldowns: 3,
  },

  run: async function ({ api, event, args }) {
    const prompt = args.join(" ");

    if (!prompt) {
      return api.sendMessage("Maglagay ka ng tanong! Halimbawa: `gemini ano ang photosynthesis?`", event.threadID, event.messageID);
    }

    // Mag-reply muna habang nag-iisip ang AI
    api.sendMessage("Thinking... 🤖", event.threadID, async (err, info) => {
      try {
        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: prompt,
          config: {
            systemInstruction: "Ikaw ay isang AI assistant sa FB Group Chat na nakikipag-usap na parang si Gemini. Maging matulungin, direct, at medyo conversational ang tono sa Tagalog/English.",
          },
        });

        // I-edit o ipadala ang mismong sagot sa GC
        api.sendMessage(response.text, event.threadID, event.messageID);
      } catch (error) {
        console.error(error);
        api.sendMessage("Nagkaroon ng error sa pagtawag kay Gemini. Subukan ulit mamaya.", event.threadID, event.messageID);
      }
    });
  }
};
