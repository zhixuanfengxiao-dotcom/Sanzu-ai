const Canvas = require("canvas");
const path = require("path");

// ============================================================================
// FONT REGISTRATION & MATH UTILS
// ============================================================================
const fontDir = path.join(__dirname, "assets", "font");
const defaultFontName = "BeVietnamPro-SemiBold";
const defaultPathFontName = path.join(fontDir, "BeVietnamPro-SemiBold.ttf");

try {
	Canvas.registerFont(path.join(fontDir, "BeVietnamPro-Bold.ttf"), { family: "BeVietnamPro-Bold" });
	Canvas.registerFont(defaultPathFontName, { family: defaultFontName });
} catch (e) {
	console.error("[RANK COMMAND] Error registering fonts:", e.message);
}

let deltaNext = 5;
const expToLevel = (exp, deltaNextLevel = deltaNext) => Math.floor((1 + Math.sqrt(1 + (8 * exp) / deltaNextLevel)) / 2);
const levelToExp = (level, deltaNextLevel = deltaNext) => Math.floor((((Math.pow(level, 2) - level) * deltaNextLevel) / 2));

// ============================================================================
// MODULE CONFIG & EXPORTS
// ============================================================================
module.exports.config = {
	name: "rank",
	version: "1.7",
	hasPermission: 0,
	credits: "NTKhang",
	description: "Tingnan ang level mo o ng na-tag na tao. Pwede mag-tag ng marami",
	usePrefix: true,
	commandCategory: "rank",
	usages: "[@tags | iwanang blangko]",
	cooldowns: 5,
	envConfig: {
		deltaNext: 5
	}
};

module.exports.run = async function ({ api, event, message, usersData, threadsData, commandName, envCommands }) {
	deltaNext = envCommands?.[commandName]?.deltaNext || 5;
	const mentions = Object.keys(event.mentions || {});
	const targetUsers = mentions.length === 0 ? [event.senderID] : mentions;

	try {
		const rankCards = await Promise.all(
			targetUsers.map(async (userID) => {
				const rankCardStream = await makeRankCard(userID, usersData, threadsData, event.threadID, deltaNext, api);
				const fileName = `${global.utils?.randomString ? global.utils.randomString(10) : Date.now()}.png`;
				rankCardStream.path = fileName;
				return rankCardStream;
			})
		);

		if (message && typeof message.reply === "function") {
			return message.reply({ attachment: rankCards });
		} else {
			return api.sendMessage({ attachment: rankCards }, event.threadID, event.messageID);
		}
	} catch (error) {
		console.error("[RANK COMMAND ERROR]:", error);
		const errorMsg = "❌ Nagkaroon ng error sa pag-generate ng rank card.";
		return message?.reply ? message.reply(errorMsg) : api.sendMessage(errorMsg, event.threadID, event.messageID);
	}
};

module.exports.onStart = module.exports.run;

module.exports.onChat = async function ({ usersData, event }) {
	if (!event.senderID) return;
	try {
		const userData = await usersData.get(event.senderID);
		let exp = Number(userData?.exp);
		if (isNaN(exp) || typeof exp !== "number") exp = 0;

		await usersData.set(event.senderID, { exp: exp + 1 });
	} catch (e) {
		// Silent catch for background EXP gain
	}
};

// ============================================================================
// RANK CARD GENERATOR FUNCTIONS
// ============================================================================
const defaultDesignCard = {
	widthCard: 2000,
	heightCard: 500,
	main_color: "#474747",
	sub_color: "rgba(255, 255, 255, 0.5)",
	alpha_subcard: 0.9,
	exp_color: "#e1e1e1",
	expNextLevel_color: "#3f3f3f",
	text_color: "#000000"
};

async function makeRankCard(userID, usersData, threadsData, threadID, deltaNext, api = global.GoatBot?.fcaApi) {
	const userData = await usersData.get(userID);
	const exp = userData?.exp || 0;
	const levelUser = expToLevel(exp, deltaNext);

	const expNextLevel = levelToExp(levelUser + 1, deltaNext) - levelToExp(levelUser, deltaNext);
	const currentExp = expNextLevel - (levelToExp(levelUser + 1, deltaNext) - exp);

	const allUser = await usersData.getAll();
	allUser.sort((a, b) => (b.exp || 0) - (a.exp || 0));

	const rankIndex = allUser.findIndex((user) => user.userID == userID);
	const rank = rankIndex !== -1 ? rankIndex + 1 : allUser.length;
	const userName = allUser[rankIndex]?.name || userData?.name || "User";

	const customRankCard = (await threadsData.get(threadID, "data.customRankCard")) || {};

	const dataLevel = {
		exp: currentExp,
		expNextLevel,
		name: userName,
		rank: `#${rank}/${allUser.length}`,
		level: levelUser,
		avatar: await usersData.getAvatarUrl(userID)
	};

	const configRankCard = { ...defaultDesignCard, ...customRankCard };
	const checkImagKey = ["main_color", "sub_color", "line_color", "exp_color", "expNextLevel_color"];

	for (const key of checkImagKey) {
		if (configRankCard[key] && !isNaN(configRankCard[key]) && api?.resolvePhotoUrl) {
			configRankCard[key] = await api.resolvePhotoUrl(configRankCard[key]);
		}
	}

	const image = new RankCard({ ...configRankCard, ...dataLevel });
	return await image.buildCard();
}

global.client = global.client || {};
global.client.makeRankCard = makeRankCard;

// ============================================================================
// CANVAS RANKCARD CLASS
// ============================================================================
class RankCard {
	constructor(options = {}) {
		this.widthCard = 2000;
		this.heightCard = 500;
		this.main_color = "#474747";
		this.sub_color = "rgba(255, 255, 255, 0.5)";
		this.alpha_subcard = 0.9;
		this.exp_color = "#e1e1e1";
		this.expNextLevel_color = "#3f3f3f";
		this.text_color = "#000000";
		this.fontName = "BeVietnamPro-Bold";
		this.textSize = 0;

		Object.assign(this, options);
	}

	registerFont(pathFont, name) {
		Canvas.registerFont(pathFont, { family: name });
		return this;
	}

	setFontName(fontName) {
		this.fontName = fontName;
		return this;
	}

	increaseTextSize(size) {
		if (isNaN(size) || size < 0) throw new Error("Size must be a positive number");
		this.textSize = size;
		return this;
	}

	decreaseTextSize(size) {
		if (isNaN(size) || size < 0) throw new Error("Size must be a positive number");
		this.textSize = -size;
		return this;
	}

	setWidthCard(widthCard) {
		if (isNaN(widthCard) || widthCard < 0) throw new Error("Width card must be a positive number");
		this.widthCard = Number(widthCard);
		return this;
	}

	setHeightCard(heightCard) {
		if (isNaN(heightCard) || heightCard < 0) throw new Error("Height card must be a positive number");
		this.heightCard = Number(heightCard);
		return this;
	}

	setAlphaSubCard(alpha_subcard) {
		if (isNaN(alpha_subcard) || alpha_subcard < 0 || alpha_subcard > 1) {
			throw new Error("Alpha subcard must be between 0 and 1");
		}
		this.alpha_subcard = Number(alpha_subcard);
		return this;
	}

	setMainColor(main_color) {
		checkFormatColor(main_color);
		this.main_color = main_color;
		return this;
	}

	setSubColor(sub_color) {
		checkFormatColor(sub_color);
		this.sub_color = sub_color;
		return this;
	}

	setExpColor(exp_color) {
		checkFormatColor(exp_color);
		this.exp_color = exp_color;
		return this;
	}

	setExpBarColor(expNextLevel_color) {
		checkFormatColor(expNextLevel_color);
		this.expNextLevel_color = expNextLevel_color;
		return this;
	}

	setTextColor(text_color) {
		checkFormatColor(text_color, false);
		this.text_color = text_color;
		return this;
	}

	setNameColor(name_color) {
		checkFormatColor(name_color, false);
		this.name_color = name_color;
		return this;
	}

	setLevelColor(level_color) {
		checkFormatColor(level_color, false);
		this.level_color = level_color;
		return this;
	}

	setExpTextColor(exp_text_color) {
		checkFormatColor(exp_text_color, false);
		this.exp_text_color = exp_text_color;
		return this;
	}

	setRankColor(rank_color) {
		checkFormatColor(rank_color, false);
		this.rank_color = rank_color;
		return this;
	}

	setLineColor(line_color) {
		this.line_color = line_color;
		return this;
	}

	setExp(exp) {
		this.exp = exp;
		return this;
	}

	setExpNextLevel(expNextLevel) {
		this.expNextLevel = expNextLevel;
		return this;
	}

	setLevel(level) {
		this.level = level;
		return this;
	}

	setRank(rank) {
		this.rank = rank;
		return this;
	}

	setName(name) {
		this.name = name;
		return this;
	}

	setAvatar(avatar) {
		this.avatar = avatar;
		return this;
	}

	async buildCard() {
		const widthCard = Number(this.widthCard);
		const heightCard = Number(this.heightCard);
		const percentage = (total) => total / 100;

		const {
			main_color,
			sub_color,
			alpha_subcard,
			exp_color,
			expNextLevel_color,
			text_color,
			name_color,
			level_color,
			rank_color,
			line_color,
			exp_text_color,
			exp = 0,
			expNextLevel = 1,
			name = "User",
			level = 0,
			rank = "#1",
			avatar
		} = this;

		const canvas = Canvas.createCanvas(widthCard, heightCard);
		const ctx = canvas.getContext("2d");

		const alignRim = 3 * percentage(widthCard);
		ctx.globalAlpha = parseFloat(alpha_subcard || 0);
		await checkColorOrImageAndDraw(alignRim, alignRim, widthCard - alignRim * 2, heightCard - alignRim * 2, ctx, sub_color, 20);
		ctx.globalAlpha = 1;

		ctx.globalCompositeOperation = "destination-out";
		const xyAvatar = heightCard / 2;
		const resizeAvatar = 60 * percentage(heightCard);

		const widthLineBetween = 58 * percentage(widthCard);
		const heightLineBetween = 2 * percentage(heightCard);
		const angleLineCenter = 40;
		const edge = (heightCard / 2) * Math.tan((angleLineCenter * Math.PI) / 180);

		if (line_color) {
			if (!isUrl(line_color)) {
				ctx.fillStyle = ctx.strokeStyle = checkGradientColor(
					ctx,
					Array.isArray(line_color) ? line_color : [line_color],
					xyAvatar - resizeAvatar / 2 - heightLineBetween,
					0,
					xyAvatar + resizeAvatar / 2 + widthLineBetween + edge,
					0
				);
				ctx.globalCompositeOperation = "source-over";
			} else {
				ctx.save();
				const img = Canvas.loadImage(line_color);
				ctx.globalCompositeOperation = "source-over";

				ctx.beginPath();
				ctx.arc(xyAvatar, xyAvatar, resizeAvatar / 2 + heightLineBetween, 0, 2 * Math.PI);
				ctx.fill();

				ctx.rect(xyAvatar + resizeAvatar / 2, heightCard / 2 - heightLineBetween / 2, widthLineBetween, heightLineBetween);
				ctx.fill();

				ctx.translate(xyAvatar + resizeAvatar / 2 + widthLineBetween + edge, 0);
				ctx.rotate((angleLineCenter * Math.PI) / 180);
				ctx.rect(0, 0, heightLineBetween, 1000);
				ctx.fill();
				ctx.rotate((-angleLineCenter * Math.PI) / 180);
				ctx.translate(-xyAvatar - resizeAvatar / 2 - widthLineBetween - edge, 0);

				ctx.clip();
				ctx.drawImage(await img, 0, 0, widthCard, heightCard);
				ctx.restore();
			}
		}

		ctx.beginPath();
		if (!isUrl(line_color)) {
			ctx.rect(xyAvatar + resizeAvatar / 2, heightCard / 2 - heightLineBetween / 2, widthLineBetween, heightLineBetween);
		}
		ctx.fill();

		ctx.beginPath();
		if (!isUrl(line_color)) {
			ctx.moveTo(xyAvatar + resizeAvatar / 2 + widthLineBetween + edge, 0);
			ctx.lineTo(xyAvatar + resizeAvatar / 2 + widthLineBetween - edge, heightCard);
			ctx.lineWidth = heightLineBetween;
			ctx.stroke();
		}

		ctx.beginPath();
		if (!isUrl(line_color)) {
			ctx.arc(xyAvatar, xyAvatar, resizeAvatar / 2 + heightLineBetween, 0, 2 * Math.PI);
		}
		ctx.fill();
		ctx.globalCompositeOperation = "destination-out";

		ctx.fillRect(0, 0, widthCard, alignRim);
		ctx.fillRect(0, heightCard - alignRim, widthCard, alignRim);

		const radius = 6 * percentage(heightCard);
		const xStartExp = (25 + 1.5) * percentage(widthCard);
		const yStartExp = 67 * percentage(heightCard);
		const widthExp = 40.5 * percentage(widthCard);
		const heightExp = radius * 2;

		ctx.globalCompositeOperation = "source-over";
		if (avatar) {
			try {
				const loadedAvatar = await Canvas.loadImage(avatar);
				centerImage(ctx, loadedAvatar, xyAvatar, xyAvatar, resizeAvatar, resizeAvatar);
			} catch (e) {
				console.error("[RANK CARD] Error loading avatar image:", e.message);
			}
		}

		if (!isUrl(expNextLevel_color)) {
			ctx.beginPath();
			ctx.fillStyle = checkGradientColor(ctx, expNextLevel_color, xStartExp, yStartExp, xStartExp + widthExp, yStartExp);
			ctx.arc(xStartExp, yStartExp + radius, radius, 1.5 * Math.PI, 0.5 * Math.PI, true);
			ctx.fill();
			ctx.fillRect(xStartExp, yStartExp, widthExp, heightExp);
			ctx.arc(xStartExp + widthExp, yStartExp + radius, radius, 1.5 * Math.PI, 0.5 * Math.PI, false);
			ctx.fill();
		} else {
			ctx.save();
			ctx.beginPath();
			ctx.moveTo(xStartExp, yStartExp);
			ctx.lineTo(xStartExp + widthExp, yStartExp);
			ctx.arcTo(xStartExp + widthExp + radius, yStartExp, xStartExp + widthExp + radius, yStartExp + radius, radius);
			ctx.lineTo(xStartExp + widthExp + radius, yStartExp + heightExp - radius);
			ctx.arcTo(xStartExp + widthExp + radius, yStartExp + heightExp, xStartExp + widthExp, yStartExp + heightExp, radius);
			ctx.lineTo(xStartExp, yStartExp + heightExp);
			ctx.arcTo(xStartExp, yStartExp + heightExp, xStartExp - radius, yStartExp + heightExp - radius, radius);
			ctx.lineTo(xStartExp - radius, yStartExp + radius);
			ctx.arcTo(xStartExp, yStartExp, xStartExp, yStartExp, radius);
			ctx.closePath();
			ctx.clip();
			ctx.drawImage(await Canvas.loadImage(expNextLevel_color), xStartExp, yStartExp, widthExp + radius, heightExp);
			ctx.restore();
		}

		const widthExpCurrent = Math.min((100 / (expNextLevel || 1)) * exp, 100) * percentage(widthExp);
		if (!isUrl(exp_color)) {
			ctx.fillStyle = checkGradientColor(ctx, exp_color, xStartExp, yStartExp, xStartExp + widthExp, yStartExp);
			ctx.beginPath();
			ctx.arc(xStartExp, yStartExp + radius, radius, 1.5 * Math.PI, 0.5 * Math.PI, true);
			ctx.fill();
			ctx.fillRect(xStartExp, yStartExp, widthExpCurrent, heightExp);
			ctx.beginPath();
			ctx.arc(xStartExp + widthExpCurrent - 1, yStartExp + radius, radius, 1.5 * Math.PI, 0.5 * Math.PI);
			ctx.fill();
		} else {
			const imgExp = await Canvas.loadImage(exp_color);
			ctx.save();
			ctx.beginPath();
			ctx.moveTo(xStartExp, yStartExp);
			ctx.lineTo(xStartExp + widthExpCurrent, yStartExp);
			ctx.arc(xStartExp + widthExpCurrent, yStartExp + radius, radius, 1.5 * Math.PI, 0.5 * Math.PI, false);
			ctx.lineTo(xStartExp + widthExpCurrent + radius, yStartExp + heightExp - radius);
			ctx.arcTo(xStartExp + widthExpCurrent + radius, yStartExp + heightExp, xStartExp + widthExpCurrent, yStartExp + heightExp, radius);
			ctx.lineTo(xStartExp, yStartExp + heightExp);
			ctx.arc(xStartExp, yStartExp + radius, radius, 1.5 * Math.PI, 0.5 * Math.PI, true);
			ctx.lineTo(xStartExp - radius, yStartExp + radius);
			ctx.arc(xStartExp, yStartExp + radius, radius, 1.5 * Math.PI, 0.5 * Math.PI, true);
			ctx.closePath();
			ctx.clip();
			ctx.drawImage(imgExp, xStartExp - radius, yStartExp, widthExp + radius * 2, heightExp);
			ctx.restore();
		}

		const maxSizeFont_Name = 4 * percentage(widthCard) + this.textSize;
		const maxSizeFont_Exp = 2 * percentage(widthCard) + this.textSize;
		const maxSizeFont_Level = 3.25 * percentage(widthCard) + this.textSize;
		const maxSizeFont_Rank = 4 * percentage(widthCard) + this.textSize;

		ctx.textAlign = "end";

		ctx.font = autoSizeFont(18.4 * percentage(widthCard), maxSizeFont_Rank, String(rank), ctx, this.fontName);
		const metricsRank = ctx.measureText(String(rank));
		ctx.fillStyle = checkGradientColor(
			ctx,
			rank_color || text_color,
			94 * percentage(widthCard) - metricsRank.width,
			76 * percentage(heightCard) + (metricsRank.emHeightDescent || 0),
			94 * percentage(widthCard),
			76 * percentage(heightCard) - (metricsRank.actualBoundingBoxAscent || 0)
		);
		ctx.fillText(String(rank), 94 * percentage(widthCard), 76 * percentage(heightCard));

		const textLevel = `Lv ${level}`;
		ctx.font = autoSizeFont(9.8 * percentage(widthCard), maxSizeFont_Level, textLevel, ctx, this.fontName);
		const metricsLevel = ctx.measureText(textLevel);
		const xStartLevel = 94 * percentage(widthCard);
		const yStartLevel = 32 * percentage(heightCard);
		ctx.fillStyle = checkGradientColor(
			ctx,
			level_color || text_color,
			xStartLevel - metricsLevel.width,
			yStartLevel + (metricsLevel.emHeightDescent || 0),
			xStartLevel,
			yStartLevel - (metricsLevel.actualBoundingBoxAscent || 0)
		);
		ctx.fillText(textLevel, xStartLevel, yStartLevel);

		ctx.font = autoSizeFont(52.1 * percentage(widthCard), maxSizeFont_Name, name, ctx, this.fontName);
		ctx.textAlign = "center";
		const metricsName = ctx.measureText(name);
		ctx.fillStyle = checkGradientColor(
			ctx,
			name_color || text_color,
			47.5 * percentage(widthCard) - metricsName.width / 2,
			40 * percentage(heightCard) + (metricsName.emHeightDescent || 0),
			47.5 * percentage(widthCard) + metricsName.width / 2,
			40 * percentage(heightCard) - (metricsName.actualBoundingBoxAscent || 0)
		);
		ctx.fillText(name, 47.5 * percentage(widthCard), 40 * percentage(heightCard));

		const textExp = `Exp ${exp}/${expNextLevel}`;
		ctx.font = autoSizeFont(49 * percentage(widthCard), maxSizeFont_Exp, textExp, ctx, this.fontName);
		const metricsExp = ctx.measureText(textExp);
		ctx.fillStyle = checkGradientColor(
			ctx,
			exp_text_color || text_color,
			47.5 * percentage(widthCard) - metricsExp.width / 2,
			61.4 * percentage(heightCard) + (metricsExp.emHeightDescent || 0),
			47.5 * percentage(widthCard) + metricsExp.width / 2,
			61.4 * percentage(heightCard) - (metricsExp.actualBoundingBoxAscent || 0)
		);
		ctx.fillText(textExp, 47.5 * percentage(widthCard), 61.4 * percentage(heightCard));

		ctx.globalCompositeOperation = "destination-over";
		if (typeof main_color === "string" && (main_color.match(/^https?:\/\//) || Buffer.isBuffer(main_color))) {
			ctx.beginPath();
			ctx.moveTo(radius, 0);
			ctx.lineTo(widthCard - radius, 0);
			ctx.quadraticCurveTo(widthCard, 0, widthCard, radius);
			ctx.lineTo(widthCard, heightCard - radius);
			ctx.quadraticCurveTo(widthCard, heightCard, widthCard - radius, heightCard);
			ctx.lineTo(radius, heightCard);
			ctx.quadraticCurveTo(0, heightCard, 0, heightCard - radius);
			ctx.lineTo(0, radius);
			ctx.quadraticCurveTo(0, 0, radius, 0);
			ctx.closePath();
			ctx.clip();
			ctx.drawImage(await Canvas.loadImage(main_color), 0, 0, widthCard, heightCard);
		} else {
			ctx.fillStyle = checkGradientColor(ctx, main_color, 0, 0, widthCard, heightCard);
			drawSquareRounded(ctx, 0, 0, widthCard, heightCard, radius, main_color);
		}

		return canvas.createPNGStream();
	}
}

// ============================================================================
// HELPER DRAWING FUNCTIONS
// ============================================================================
async function checkColorOrImageAndDraw(xStart, yStart, width, height, ctx, colorOrImage, r) {
	if (typeof colorOrImage === "string" && colorOrImage.match(/^https?:\/\//)) {
		const imageLoad = await Canvas.loadImage(colorOrImage);
		ctx.save();
		roundedImage(xStart, yStart, width, height, r, ctx);
		ctx.clip();
		ctx.drawImage(imageLoad, xStart, yStart, width, height);
		ctx.restore();
	} else {
		if (Array.isArray(colorOrImage)) {
			const gradient = ctx.createLinearGradient(xStart, yStart, xStart + width, yStart + height);
			colorOrImage.forEach((color, index) => {
				gradient.addColorStop(index / (colorOrImage.length - 1), color);
			});
			ctx.fillStyle = gradient;
		}
		drawSquareRounded(ctx, xStart, yStart, width, height, r, colorOrImage);
	}
}

function drawSquareRounded(ctx, x, y, w, h, r, color, defaultGlobalCompositeOperation, notChangeColor) {
	ctx.save();
	if (defaultGlobalCompositeOperation) ctx.globalCompositeOperation = "source-over";
	if (w < 2 * r) r = w / 2;
	if (h < 2 * r) r = h / 2;
	ctx.beginPath();
	ctx.moveTo(x + r, y);
	ctx.arcTo(x + w, y, x + w, y + h, r);
	ctx.arcTo(x + w, y + h, x, y + h, r);
	ctx.arcTo(x, y + h, x, y, r);
	ctx.arcTo(x, y, x + w, y, r);
	ctx.closePath();
	if (!notChangeColor && color) ctx.fillStyle = color;
	ctx.fill();
	ctx.restore();
}

function roundedImage(x, y, width, height, radius, ctx) {
	ctx.beginPath();
	ctx.moveTo(x + radius, y);
	ctx.lineTo(x + width - radius, y);
	ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
	ctx.lineTo(x + width, y + height - radius);
	ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
	ctx.lineTo(x + radius, y + height);
	ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
	ctx.lineTo(x, y + radius);
	ctx.quadraticCurveTo(x, y, x + radius, y);
	ctx.closePath();
}

function centerImage(ctx, img, xCenter, yCenter, w, h) {
	const x = xCenter - w / 2;
	const y = yCenter - h / 2;
	ctx.save();
	ctx.beginPath();
	ctx.arc(xCenter, yCenter, w / 2, 0, 2 * Math.PI);
	ctx.clip();
	ctx.closePath();
	ctx.drawImage(img, x, y, w, h);
	ctx.restore();
}

function autoSizeFont(maxWidthText, maxSizeFont, text, ctx, fontName) {
	let sizeFont = 0;
	while (true) {
		sizeFont += 1;
		ctx.font = `${sizeFont}px ${fontName}`;
		const widthText = ctx.measureText(text).width;
		if (widthText > maxWidthText || sizeFont > maxSizeFont) break;
	}
	return `${sizeFont}px ${fontName}`;
}

function checkGradientColor(ctx, color, x1, y1, x2, y2) {
	if (Array.isArray(color)) {
		const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
		color.forEach((c, index) => {
			gradient.addColorStop(index / (color.length - 1), c);
		});
		return gradient;
	}
	return color;
}

function isUrl(string) {
	if (typeof string !== "string") return false;
	try {
		new URL(string);
		return true;
	} catch {
		return false;
	}
}

function checkFormatColor(color, enableUrl = true) {
	if (
		typeof color !== "string" &&
		!Array.isArray(color) &&
		!/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color) &&
		!/^rgb\((\d{1,3}), (\d{1,3}), (\d{1,3})\)$/.test(color) &&
		!/^rgba\((\d{1,3}), (\d{1,3}), (\d{1,3}), (\d{1,3})\)$/.test(color) &&
		(enableUrl ? !isUrl(color) : true)
	) {
		throw new Error(`The color format must be hex, rgb, rgba${enableUrl ? ", url image" : ""}, or an array of colors.`);
	}
}
