module.exports.config = {
  name: "rps",
  version: "1.0.0",
  hasPermission: 0,
  credits: "sinzu",
  description: "Rock Paper Scissors Game",
  usePrefix: true,
  commandCategory: "Games",
  usages: "!rps [rock/paper/scissors]",
  cooldowns: 3
};

module.exports.run = async function({ api, event, args }) {
  const userChoice = args[0]?.toLowerCase();
  const choices = ["rock", "paper", "scissors"];

  if (!choices.includes(userChoice)) {
    return api.sendMessage("❌ Pumili ng: rock, paper, o scissors.\nHalimbawa: !rps rock", event.threadID, event.messageID);
  }

  const botChoice = choices[Math.floor(Math.random() * choices.length)];

  if (userChoice === botChoice) {
    return api.sendMessage(`🤝 *TIE!* Pareho kayong pumili ng ${userChoice.toUpperCase()}.`, event.threadID, event.messageID);
  }

  const win = (userChoice === "rock" && botChoice === "scissors") ||
              (userChoice === "paper" && botChoice === "rock") ||
              (userChoice === "scissors" && botChoice === "paper");

  if (win) {
    api.sendMessage(`🎉 *PANALO KA!*\n\nIkaw: ${userChoice.toUpperCase()}\nBot: ${botChoice.toUpperCase()}`, event.threadID, event.messageID);
  } else {
    api.sendMessage(`💥 *TALO KA!*\n\nIkaw: ${userChoice.toUpperCase()}\nBot: ${botChoice.toUpperCase()}`, event.threadID, event.messageID);
  }
};

module.exports.onStart = module.exports.run;
