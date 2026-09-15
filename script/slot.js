module.exports.config = {
  name: "slots",
  version: "1.0.0",
  hasPermission: 0,
  credits: "sinzu",
  description: "Maglaro ng Slot Machine",
  usePrefix: true,
  commandCategory: "Games",
  usages: "!slots [bet]",
  cooldowns: 5
};

module.exports.run = async function({ api, event, args }) {
  const bet = parseInt(args[0]) || 100;
  const items = ["🎰", "🍒", "🍋", "🍉", "⭐", "💎"];
  
  const c1 = items[Math.floor(Math.random() * items.length)];
  const c2 = items[Math.floor(Math.random() * items.length)];
  const c3 = items[Math.floor(Math.random() * items.length)];

  let resultHeader = `🎰 [ SLOTS MACHINE ]\n━━━━━━━━━━━━━━━━━\n[ ${c1} | ${c2} | ${c3} ]\n━━━━━━━━━━━━━━━━━\n`;

  if (c1 === c2 && c2 === c3) {
    api.sendMessage(`${resultHeader}🔥 *JACKPOT!* Nanalo ka ng ${bet * 5} coins!`, event.threadID, event.messageID);
  } else if (c1 === c2 || c2 === c3 || c1 === c3) {
    api.sendMessage(`${resultHeader}🎉 *2 MATCHES!* Nanalo ka ng ${bet * 2} coins!`, event.threadID, event.messageID);
  } else {
    api.sendMessage(`${resultHeader}💥 *TALO!* Subukan ulit.`, event.threadID, event.messageID);
  }
};

module.exports.onStart = module.exports.run;
