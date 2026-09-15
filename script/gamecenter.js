module.exports.config = {
  name: "gamecenter",
  version: "1.0.0",
  hasPermission: 0,
  credits: "sinzu",
  description: "Ipinapakita ang Game Center Menu",
  usePrefix: true,
  commandCategory: "Games",
  usages: "!gamecenter",
  cooldowns: 3
};

module.exports.run = async function({ api, event }) {
  const menuText = `╭━━━━━━━━━━━━━━━━━━━━╮
       🎮 GAME CENTER
╰━━━━━━━━━━━━━━━━━━━━╯

✊ RPS
!rps [rock/paper/scissors]

🎲 ROLL
!roll [bet]

🪙 COINFLIP
!coinflip [heads/tails] [bet]

🎰 SLOTS
!slots [bet]

🔮 8-BALL
!8ball [tanong]

❤️ AI LOVE STORY
!lovestory [Boy] [Girl]

💡 Type !help para sa buong bot menu.`;

  api.sendMessage(menuText, event.threadID, event.messageID);
};

module.exports.onStart = module.exports.run;
