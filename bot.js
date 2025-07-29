require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const prisma = require('./prisma'); // Using our centralized prisma client

const token = process.env.TELEGRAM_BOT_TOKEN;
const bot = new TelegramBot(token); // We will start polling from index.js

console.log("Bot server started...");

// COMMAND: /start
bot.onText(/\/start/, (msg) => {
    bot.sendMessage(
        msg.chat.id,
        "Welcome to Afelu Guardian! To use this service, you need an access code. Use the /redeem command. For example:\n\n/redeem ET-XXXX-XXXX"
    );
});

// COMMAND: /redeem <code>
bot.onText(/\/redeem (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const telegramId = BigInt(msg.from.id); // Telegram IDs are large numbers
    const code = match[1]; // The captured code from the regex

    try {
        // 1. Find the access code in the database
        const accessCode = await prisma.accessCode.findUnique({
            where: { code: code },
        });

        // 2. Check if the code exists and is new
        if (!accessCode) {
            return bot.sendMessage(chatId, "Sorry, that access code is not valid. Please check the code and try again.");
        }
        if (accessCode.status === 'USED') {
            return bot.sendMessage(chatId, "This access code has already been used.");
        }

        // 3. Define the quotas for a successful redemption
        const GPT_QUOTA = 500;
        const FETCH_QUOTA = 100;

        // 4. Create or update the user, and link the access code
        // `upsert` is perfect: it updates a user if they exist, or creates them if they don't.
        await prisma.user.upsert({
            where: { telegramId: telegramId },
            update: {
                quotaGpt: { increment: GPT_QUOTA }, // Add to existing quota
                quotaFetch: { increment: FETCH_QUOTA },
                accessCodeId: accessCode.id // Link the new code
            },
            create: {
                telegramId: telegramId,
                quotaGpt: GPT_QUOTA,
                quotaFetch: FETCH_QUOTA,
                accessCodeId: accessCode.id
            }
        });

        // 5. Mark the code as USED
        await prisma.accessCode.update({
            where: { id: accessCode.id },
            data: { status: 'USED' },
        });

        bot.sendMessage(chatId, `✅ Success! Your code has been redeemed. You now have ${GPT_QUOTA} GPT requests and ${FETCH_QUOTA} web fetches. Use /gpt or /fetch to get started.`);

    } catch (error) {
        console.error("Redeem command failed:", error);
        bot.sendMessage(chatId, "An error occurred while trying to redeem your code. Please contact support.");
    }
});

// COMMAND: /gpt <prompt>
bot.onText(/\/gpt (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const telegramId = BigInt(msg.from.id);
    const prompt = match[1];

    try {
        const user = await prisma.user.findUnique({ where: { telegramId } });

        if (!user || user.quotaGpt <= 0) {
            return bot.sendMessage(chatId, "You have no GPT requests left. Please redeem a new access code.");
        }

        // TODO: Call the actual OpenAI API here
        bot.sendMessage(chatId, `⏳ Processing your prompt: "${prompt}"...`);
        const gptResponse = `This is a placeholder response for your prompt. In the future, the real AI answer will be here.`;
        bot.sendMessage(chatId, gptResponse);

        // Decrement the user's quota
        await prisma.user.update({
            where: { telegramId },
            data: { quotaGpt: { decrement: 1 } },
        });

    } catch (error) {
        console.error("GPT command failed:", error);
        bot.sendMessage(chatId, "Sorry, something went wrong with your request.");
    }
});

module.exports = bot; // Export the bot instance