/* 
   Sanzu-AI Framework - Game Center Suite
   File: scripts/games.js
*/

// In-Memory Database fallback (Gagamitin ang global.db kung naka-configure sa Sanzu-AI)
if (!global.db) global.db = { users: {} };

function getUser(sender) {
    if (!global.db.users[sender]) {
        global.db.users[sender] = { balance: 1000, gameActive: false };
    }
    return global.db.users[sender];
}

module.exports = [
    // 1. GAME CENTER MENU
    {
        name: 'gamecenter',
        alias: ['games', 'gmenu', 'game'],
        category: 'Games',
        description: 'Ipinapakita ang Game Center Menu',
        async execute(m, { conn, prefix }) {
            const p = prefix || '/';

            const menuText = `╭━━━━━━━━━━━━━━━━━━━━╮
       🎮 GAME CENTER
╰━━━━━━━━━━━━━━━━━━━━╯

🧠 TRIVIA
${p}trivia
Sagutan ang tanong.

✊ RPS
${p}rps [rock/paper/scissors] [bet]
Win = 2× • Tie = refund.

🎲 ROLL
${p}roll [bet]
55+ wins 2×.

🎯 GUESS
${p}guess [1-10] [bet]
Exact guess = 5×.

🪙 COINFLIP
${p}coinflip [bet] [heads/tails]
Correct = 2×.

🎰 SLOTS
${p}slots [bet]
Matching symbols pay out.

🃏 BLACKJACK
${p}blackjack [bet]
Pumili sa Hit o Stand.

🔮 8-BALL
${p}8ball [tanong]

🧮 MATH
${p}math
Sagutin ang simpleng Math problem.

🧩 RIDDLE
${p}riddle
Hulaan ang bugtong.

━━━━━━━━━━━━━━━━━━━━
🔥 EXTRA GAMES & BANK
━━━━━━━━━━━━━━━━━━━━

💣 MINES
${p}mines [bet]
Iwasan ang mga bomba!

🏎️ DRAG RACE
${p}dragrace [bet]
Subukan ang bilis sa karera.

🐟 FISHING
${p}fish
Manghuli ng isda pampalipas oras.

💰 BANK SYSTEM
${p}bal - Tingnan ang pera/coins
${p}daily - Kumuha ng daily bonus

💡 Type ${p}help para sa kumpletong bot menu.`;

            await conn.sendMessage(m.chat, { text: menuText }, { quoted: m });
        }
    },

    // 2. BANK: BALANCE
    {
        name: 'bal',
        alias: ['balance', 'coins', 'money'],
        category: 'Games',
        async execute(m, { conn }) {
            const user = getUser(m.sender);
            await conn.sendMessage(m.chat, { text: `💰 *WALLET:* Mayroon kang *$${user.balance}* coins.` }, { quoted: m });
        }
    },

    // 3. BANK: DAILY BONUS
    {
        name: 'daily',
        category: 'Games',
        async execute(m, { conn }) {
            const user = getUser(m.sender);
            const reward = 500;
            user.balance += reward;
            await conn.sendMessage(m.chat, { text: `🎁 *DAILY BONUS:* Nakatanggap ka ng *$${reward}* coins!\n💰 Total Balance: *$${user.balance}*` }, { quoted: m });
        }
    },

    // 4. ROCK-PAPER-SCISSORS
    {
        name: 'rps',
        category: 'Games',
        async execute(m, { conn, args, prefix }) {
            const p = prefix || '/';
            const user = getUser(m.sender);
            const choice = args[0]?.toLowerCase();
            const bet = parseInt(args[1]);

            if (!['rock', 'paper', 'scissors'].includes(choice) || isNaN(bet) || bet <= 0) {
                return conn.sendMessage(m.chat, { text: `❌ Gamitin: ${p}rps [rock/paper/scissors] [bet]` }, { quoted: m });
            }
            if (user.balance < bet) return conn.sendMessage(m.chat, { text: `❌ Kulang ang coins mo! Wallet: $${user.balance}` }, { quoted: m });

            const options = ['rock', 'paper', 'scissors'];
            const botChoice = options[Math.floor(Math.random() * options.length)];

            if (choice === botChoice) {
                return conn.sendMessage(m.chat, { text: `🤝 *TIE!* Pareho kayong pumili ng ${choice}. Narefund ang $${bet}.` }, { quoted: m });
            }

            const win = (choice === 'rock' && botChoice === 'scissors') ||
                        (choice === 'paper' && botChoice === 'rock') ||
                        (choice === 'scissors' && botChoice === 'paper');

            if (win) {
                user.balance += bet;
                await conn.sendMessage(m.chat, { text: `🎉 *PANALO!* Pumili ang bot ng *${botChoice}*.\n➕ Nanalo ka ng $${bet * 2}! New Balance: $${user.balance}` }, { quoted: m });
            } else {
                user.balance -= bet;
                await conn.sendMessage(m.chat, { text: `💥 *TALO!* Pumili ang bot ng *${botChoice}*.\n➖ Nabawasan ka ng $${bet}. New Balance: $${user.balance}` }, { quoted: m });
            }
        }
    },

    // 5. ROLL DICE
    {
        name: 'roll',
        category: 'Games',
        async execute(m, { conn, args, prefix }) {
            const p = prefix || '/';
            const user = getUser(m.sender);
            const bet = parseInt(args[0]);

            if (isNaN(bet) || bet <= 0) return conn.sendMessage(m.chat, { text: `❌ Gamitin: ${p}roll [bet]` }, { quoted: m });
            if (user.balance < bet) return conn.sendMessage(m.chat, { text: `❌ Kulang ang coins mo!` }, { quoted: m });

            const roll = Math.floor(Math.random() * 100) + 1;
            if (roll >= 55) {
                user.balance += bet;
                await conn.sendMessage(m.chat, { text: `🎲 *ROLL:* Nakuha mo ay *${roll}* (55+ Wins).\n🎉 Nanalo ka ng $${bet * 2}!` }, { quoted: m });
            } else {
                user.balance -= bet;
                await conn.sendMessage(m.chat, { text: `🎲 *ROLL:* Nakuha mo ay *${roll}*.\n💥 Talo ka ng $${bet}.` }, { quoted: m });
            }
        }
    },

    // 6. GUESS THE NUMBER
    {
        name: 'guess',
        category: 'Games',
        async execute(m, { conn, args, prefix }) {
            const p = prefix || '/';
            const user = getUser(m.sender);
            const guess = parseInt(args[0]);
            const bet = parseInt(args[1]);

            if (isNaN(guess) || guess < 1 || guess > 10 || isNaN(bet)) {
                return conn.sendMessage(m.chat, { text: `❌ Gamitin: ${p}guess [1-10] [bet]` }, { quoted: m });
            }
            if (user.balance < bet) return conn.sendMessage(m.chat, { text: `❌ Kulang ang coins mo!` }, { quoted: m });

            const secret = Math.floor(Math.random() * 10) + 1;
            if (guess === secret) {
                const prize = bet * 5;
                user.balance += prize;
                await conn.sendMessage(m.chat, { text: `🎯 *EXACT MATCH!* Ang numero ay *${secret}*.\n🎉 Nanalo ka ng $${prize} (5x)!` }, { quoted: m });
            } else {
                user.balance -= bet;
                await conn.sendMessage(m.chat, { text: `🎯 *MALI!* Ang tamang numero ay *${secret}*.\n💥 Talo ka ng $${bet}.` }, { quoted: m });
            }
        }
    },

    // 7. COINFLIP
    {
        name: 'coinflip',
        category: 'Games',
        async execute(m, { conn, args, prefix }) {
            const p = prefix || '/';
            const user = getUser(m.sender);
            const bet = parseInt(args[0]);
            const side = args[1]?.toLowerCase();

            if (isNaN(bet) || !['heads', 'tails'].includes(side)) {
                return conn.sendMessage(m.chat, { text: `❌ Gamitin: ${p}coinflip [bet] [heads/tails]` }, { quoted: m });
            }
            if (user.balance < bet) return conn.sendMessage(m.chat, { text: `❌ Kulang ang coins mo!` }, { quoted: m });

            const outcome = Math.random() < 0.5 ? 'heads' : 'tails';
            if (side === outcome) {
                user.balance += bet;
                await conn.sendMessage(m.chat, { text: `🪙 *FLIP:* Lumabas ang *${outcome.toUpperCase()}*!\n🎉 Nanalo ka ng $${bet * 2}!` }, { quoted: m });
            } else {
                user.balance -= bet;
                await conn.sendMessage(m.chat, { text: `🪙 *FLIP:* Lumabas ang *${outcome.toUpperCase()}*.\n💥 Talo ka ng $${bet}.` }, { quoted: m });
            }
        }
    },

    // 8. SLOTS
    {
        name: 'slots',
        category: 'Games',
        async execute(m, { conn, args, prefix }) {
            const p = prefix || '/';
            const user = getUser(m.sender);
            const bet = parseInt(args[0]);

            if (isNaN(bet) || bet <= 0) return conn.sendMessage(m.chat, { text: `❌ Gamitin: ${p}slots [bet]` }, { quoted: m });
            if (user.balance < bet) return conn.sendMessage(m.chat, { text: `❌ Kulang ang coins mo!` }, { quoted: m });

            const items = ['🎰', '🍒', '🍋', '🍉', '⭐', '💎'];
            const c1 = items[Math.floor(Math.random() * items.length)];
            const c2 = items[Math.floor(Math.random() * items.length)];
            const c3 = items[Math.floor(Math.random() * items.length)];

            const resultStr = `[ ${c1} | ${c2} | ${c3} ]`;

            if (c1 === c2 && c2 === c3) {
                const winAmt = bet * 5;
                user.balance += winAmt;
                await conn.sendMessage(m.chat, { text: `${resultStr}\n🔥 *JACKPOT!* Nanalo ka ng $${winAmt}!` }, { quoted: m });
            } else if (c1 === c2 || c2 === c3 || c1 === c3) {
                user.balance += bet;
                await conn.sendMessage(m.chat, { text: `${resultStr}\n🎉 *2 MATCHES!* Nanalo ka ng $${bet * 2}!` }, { quoted: m });
            } else {
                user.balance -= bet;
                await conn.sendMessage(m.chat, { text: `${resultStr}\n💥 *TALO!* Nabawasan ka ng $${bet}.` }, { quoted: m });
            }
        }
    },

    // 9. BLACKJACK
    {
        name: 'blackjack',
        alias: ['bj'],
        category: 'Games',
        async execute(m, { conn, args, prefix }) {
            const p = prefix || '/';
            const user = getUser(m.sender);
            const bet = parseInt(args[0]);

            if (isNaN(bet) || bet <= 0) return conn.sendMessage(m.chat, { text: `❌ Gamitin: ${p}blackjack [bet]` }, { quoted: m });
            if (user.balance < bet) return conn.sendMessage(m.chat, { text: `❌ Kulang ang coins mo!` }, { quoted: m });

            const userCard = Math.floor(Math.random() * 10) + 2 + Math.floor(Math.random() * 10) + 2;
            const dealerCard = Math.floor(Math.random() * 10) + 2 + Math.floor(Math.random() * 10) + 2;

            if (userCard > dealerCard && userCard <= 21) {
                user.balance += bet;
                await conn.sendMessage(m.chat, { text: `🃏 *BLACKJACK*\n\nYour Hand: *${userCard}*\nDealer Hand: *${dealerCard}*\n\n🎉 *PANALO KA!* +$${bet * 2}` }, { quoted: m });
            } else {
                user.balance -= bet;
                await conn.sendMessage(m.chat, { text: `🃏 *BLACKJACK*\n\nYour Hand: *${userCard}*\nDealer Hand: *${dealerCard}*\n\n💥 *TALO KA!* -$${bet}` }, { quoted: m });
            }
        }
    },

    // 10. 8-BALL
    {
        name: '8ball',
        category: 'Games',
        async execute(m, { conn, args }) {
            if (!args.length) return conn.sendMessage(m.chat, { text: `Magtanong ka sa magic 8-ball!` }, { quoted: m });

            const answers = [
                "Oo, sigurado!", "Malabo mangyari.", "Subukan mo ulit mamaya.",
                "Huwag ka nang umasa.", "Ayon sa aking nakikita, oo!", "Mataas ang tsansa!"
            ];
            const rand = answers[Math.floor(Math.random() * answers.length)];
            await conn.sendMessage(m.chat, { text: `🔮 *8-BALL:* ${rand}` }, { quoted: m });
        }
    },

    // 11. MATH CHALLENGE
    {
        name: 'math',
        category: 'Games',
        async execute(m, { conn }) {
            const n1 = Math.floor(Math.random() * 50) + 1;
            const n2 = Math.floor(Math.random() * 50) + 1;
            await conn.sendMessage(m.chat, { text: `🧮 *MATH PROBLEM:*\nMagkano ang *${n1} + ${n2}*?\n\nSagutin sa pamamagitan ng pag-reply.` }, { quoted: m });
        }
    },

    // 12. RIDDLE
    {
        name: 'riddle',
        alias: ['bugtong'],
        category: 'Games',
        async execute(m, { conn }) {
            const riddles = [
                { q: "Maliit pa si Nene, marunong nang manahi.", a: "Makaray/Lalagyan ng karayom" },
                { q: "Nang humirit ang matanda, pinaligiran ng bata.", a: "Saging" },
                { q: "Dala mo, dala ka, dala ka pa ng iyong dala.", a: "Sapatos" }
            ];
            const selected = riddles[Math.floor(Math.random() * riddles.length)];
            await conn.sendMessage(m.chat, { text: `🧩 *RIDDLE / BUGTONG:*\n\n"${selected.q}"` }, { quoted: m });
        }
    },

    // 13. MINES
    {
        name: 'mines',
        category: 'Games',
        async execute(m, { conn, args, prefix }) {
            const p = prefix || '/';
            const user = getUser(m.sender);
            const bet = parseInt(args[0]);

            if (isNaN(bet) || bet <= 0) return conn.sendMessage(m.chat, { text: `❌ Gamitin: ${p}mines [bet]` }, { quoted: m });
            if (user.balance < bet) return conn.sendMessage(m.chat, { text: `❌ Kulang ang coins mo!` }, { quoted: m });

            const hitMine = Math.random() < 0.4;
            if (hitMine) {
                user.balance -= bet;
                await conn.sendMessage(m.chat, { text: `💣 *BOOM!* Nakatapak ka ng bomba.\n💥 Talo ka ng $${bet}.` }, { quoted: m });
            } else {
                const win = bet * 2;
                user.balance += win;
                await conn.sendMessage(m.chat, { text: `💎 *LUCKY!* Ligtas ang natapakan mo.\n🎉 Nanalo ka ng $${win}!` }, { quoted: m });
            }
        }
    },

    // 14. DRAG RACE
    {
        name: 'dragrace',
        category: 'Games',
        async execute(m, { conn, args, prefix }) {
            const p = prefix || '/';
            const user = getUser(m.sender);
            const bet = parseInt(args[0]);

            if (isNaN(bet) || bet <= 0) return conn.sendMessage(m.chat, { text: `❌ Gamitin: ${p}dragrace [bet]` }, { quoted: m });
            if (user.balance < bet) return conn.sendMessage(m.chat, { text: `❌ Kulang ang coins mo!` }, { quoted: m });

            const win = Math.random() < 0.5;
            if (win) {
                user.balance += bet;
                await conn.sendMessage(m.chat, { text: `🏎️💨 *DRAG RACE:* Una kang nakatapos sa finish line!\n🎉 Nanalo ka ng $${bet * 2}!` }, { quoted: m });
            } else {
                user.balance -= bet;
                await conn.sendMessage(m.chat, { text: `🏎️💥 *DRAG RACE:* Nasiraan ka ng makina!\n💥 Talo ka ng $${bet}.` }, { quoted: m });
            }
        }
    },

    // 15. FISHING
    {
        name: 'fish',
        category: 'Games',
        async execute(m, { conn }) {
            const user = getUser(m.sender);
            const catchList = [
                { name: '🐟 Tilapia', val: 50 },
                { name: '🐠 Bangus', val: 100 },
                { name: '🦈 Pating', val: 500 },
                { name: '👞 Lumang Sapatos', val: 0 }
            ];
            const caught = catchList[Math.floor(Math.random() * catchList.length)];
            user.balance += caught.val;

            await conn.sendMessage(m.chat, { 
                text: `🎣 *FISHING:* Nakahuli ka ng *${caught.name}*!\n💰 Nabenta mo ito sa halagang $${caught.val} coins.` 
            }, { quoted: m });
        }
    }
];
