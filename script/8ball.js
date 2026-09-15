module.exports.config = {
  name: "8ball",
  version: "1.0.0",
  hasPermission: 0,
  credits: "sinzu",
  description: "Hulaan ang iyong kapalaran",
  usePrefix: true,
  commandCategory: "Games",
  usages: "!8ball [tanong]",
  cooldowns: 3
};

module.exports.run = async function({ api, event, args }) {
  const question = args.join(" ");
  if (!question) {
    return api.sendMessage("❌ Maglagay ng tanong!\nHalimbawa: !8ball Mananalo ba ako?", event.threadID, event.messageID);
  }

  const answers = [
    "Oo, sigurado!",
    "Malabo mangyari.",
    "Subukan mo ulit mamaya.",
    "Huwag ka nang umasa.",
    "Ayon sa aking nakikita, oo!",
    "Mataas ang tsansa!"
  ];

  const answer = answers[Math.floor(Math.random() * answers.length)];
  api.sendMessage(`🔮 *8-BALL*\n\n❓ Tanong: ${question}\n✨ Sagot: ${answer}`, event.threadID, event.messageID);
};

module.exports.onStart = module.exports.run;
