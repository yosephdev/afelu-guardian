require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const prisma = require('./prisma');
const openaiService = require('./services/openai');
const webfetchService = require('./services/webfetch');
const loggingService = require('./services/logging');
const { 
    validateAccessCodeFormat, 
    sanitizeInput, 
    validateTelegramId, 
    checkRateLimit 
} = require('./utils/validation');

const token = process.env.TELEGRAM_BOT_TOKEN;

if (!token) {
    console.error('❌ TELEGRAM_BOT_TOKEN is required');
    process.exit(1);
}

const bot = new TelegramBot(token, { polling: false }); // Disable polling initially

// Rate limiting maps
const rateLimitMap = new Map();
const redeemRateLimitMap = new Map();

// Bot command definitions for Telegram
const commands = [
    { command: 'start', description: 'Welcome message and getting started guide' },
    { command: 'help', description: 'Complete list of available commands' },
    { command: 'redeem', description: 'Redeem an access code (format: /redeem ET-XXXX-XXXX)' },
    { command: 'gpt', description: 'Ask AI anything (1 credit)' },
    { command: 'image', description: 'Generate AI images (3 credits)' },
    { command: 'fetch', description: 'Access websites and get content (1 fetch credit)' },
    { command: 'translate', description: 'Translate text to multiple languages (1 credit)' },
    { command: 'news', description: 'Get news summaries on any topic (1 credit)' },
    { command: 'summarize', description: 'Fetch and summarize web content (1 fetch + 1 GPT)' },
    { command: 'myquota', description: 'Check your remaining credits' }
];

console.log("🤖 Bot server started...");
if (openaiService.isConfigured()) {
    console.log("✅ OpenAI service configured");
} else {
    console.log("⚠️ OpenAI service not configured - using placeholder responses");
}

// Function to register bot commands with Telegram
async function setupBotCommands() {
    try {
        await bot.setMyCommands(commands);
        console.log("✅ Bot commands registered with Telegram");
    } catch (error) {
        console.error("❌ Failed to register bot commands:", error.message);
    }
}

// Function to start bot polling
function startBot() {
    try {
        bot.startPolling({ restart: true });
        console.log("✅ Bot polling started");
        setupBotCommands(); // Register commands after starting
    } catch (error) {
        console.error("❌ Failed to start bot polling:", error.message);
    }
}

// COMMAND: /start
bot.onText(/\/start/, (msg) => {
    const welcomeMessage = `🛡️ **Welcome to Afelu Guardian!**

Your gateway to uncensored AI and information access.

**🚀 Quick Start:**
• Get an access code from your sponsor
• Use \`/redeem ET-XXXX-XXXX\` to activate

**🤖 Available Commands:**
• \`/gpt <question>\` - Ask AI anything
• \`/image <description>\` - Generate images with AI
• \`/fetch <url>\` - Access blocked websites
• \`/news <topic>\` - Get latest news
• \`/translate <text>\` - Translate text
• \`/myquota\` - Check your remaining usage
• \`/help\` - Get detailed help

Start by redeeming your access code! 🎯`;

    bot.sendMessage(msg.chat.id, welcomeMessage, { parse_mode: 'Markdown' });
});

// COMMAND: /redeem <code>
bot.onText(/\/redeem (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const telegramId = BigInt(msg.from.id);
    const rawCode = match[1];

    // Security checks
    if (!validateTelegramId(telegramId)) {
        return bot.sendMessage(chatId, "❌ Invalid user session. Please restart the bot.");
    }

    // Rate limiting for redeem attempts (more restrictive)
    if (!checkRateLimit(redeemRateLimitMap, telegramId.toString(), 3, 300000)) { // 3 attempts per 5 minutes
        return bot.sendMessage(chatId, "⚠️ Too many redeem attempts. Please wait 5 minutes before trying again.");
    }

    // Validate and sanitize the code
    const code = sanitizeInput(rawCode).toUpperCase();
    if (!validateAccessCodeFormat(code)) {
        return bot.sendMessage(chatId, "❌ Invalid code format. Please use the format: ET-XXXX-XXXX");
    }

    try {
        // 1. Find the access code in the database
        const accessCode = await prisma.accessCode.findUnique({
            where: { code: code },
        });

        // 2. Check if the code exists and is new
        if (!accessCode) {
            return bot.sendMessage(chatId, "❌ Sorry, that access code is not valid. Please check the code and try again.");
        }
        if (accessCode.status === 'USED') {
            return bot.sendMessage(chatId, "❌ This access code has already been used.");
        }

        // 3. Check if user already has an active account
        const existingUser = await prisma.user.findUnique({
            where: { telegramId: telegramId },
        });

        // 4. Define the quotas for a successful redemption
        const GPT_QUOTA = 500;
        const FETCH_QUOTA = 100;

        // 5. Create or update the user, and link the access code
        await prisma.user.upsert({
            where: { telegramId: telegramId },
            update: {
                quotaGpt: { increment: GPT_QUOTA },
                quotaFetch: { increment: FETCH_QUOTA },
                accessCodeId: accessCode.id
            },
            create: {
                telegramId: telegramId,
                quotaGpt: GPT_QUOTA,
                quotaFetch: FETCH_QUOTA,
                accessCodeId: accessCode.id
            }
        });

        // 6. Mark the code as USED
        await prisma.accessCode.update({
            where: { id: accessCode.id },
            data: { 
                status: 'USED',
                usedAt: new Date()
            },
        });

        // Log the redemption
        const user = await prisma.user.findUnique({ where: { telegramId } });
        await loggingService.logAction(user.id, 'redeem_code', {
            accessCode: code,
            quotaGranted: { gpt: GPT_QUOTA, fetch: FETCH_QUOTA },
            isNewUser: !existingUser
        });

        const message = existingUser 
            ? `✅ Code redeemed! Added ${GPT_QUOTA} GPT requests and ${FETCH_QUOTA} web fetches to your account.`
            : `✅ Welcome! Your code has been redeemed. You now have ${GPT_QUOTA} GPT requests and ${FETCH_QUOTA} web fetches.`;
        
        bot.sendMessage(chatId, `${message}\n\nUse /gpt to ask questions or /myquota to check your balance.`);

    } catch (error) {
        console.error("❌ Redeem command failed:", error);
        bot.sendMessage(chatId, "❌ An error occurred while processing your code. Please try again later or contact support.");
    }
});

// COMMAND: /gpt <prompt>
bot.onText(/\/gpt (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const telegramId = BigInt(msg.from.id);
    const rawPrompt = match[1];

    // Security checks
    if (!validateTelegramId(telegramId)) {
        return bot.sendMessage(chatId, "❌ Invalid user session. Please restart the bot.");
    }

    // Rate limiting
    if (!checkRateLimit(rateLimitMap, telegramId.toString(), 20, 60000)) { // 20 requests per minute
        return bot.sendMessage(chatId, "⚠️ Slow down! You're sending requests too quickly. Please wait a moment.");
    }

    // Sanitize and validate prompt
    const prompt = sanitizeInput(rawPrompt);
    if (!prompt || prompt.length < 3) {
        return bot.sendMessage(chatId, "❌ Please provide a valid question or prompt (minimum 3 characters).");
    }

    if (prompt.length > 1000) {
        return bot.sendMessage(chatId, "❌ Your prompt is too long. Please keep it under 1000 characters.");
    }

    try {
        const user = await prisma.user.findUnique({ where: { telegramId } });

        if (!user) {
            return bot.sendMessage(chatId, "❌ You need to redeem an access code first. Use /redeem ET-XXXX-XXXX");
        }

        if (user.quotaGpt <= 0) {
            return bot.sendMessage(chatId, "❌ You have no GPT requests left. Please redeem a new access code or contact your sponsor.");
        }

        // Send processing message
        const processingMsg = await bot.sendMessage(chatId, `⏳ Processing your request...\n\n"${prompt.substring(0, 100)}${prompt.length > 100 ? '...' : ''}"`);

        // Get AI response from OpenAI
        const gptResponse = await openaiService.getChatCompletion(prompt);
        
        // Edit the processing message with the response
        await bot.editMessageText(`🤖 **AI Response:**\n\n${gptResponse}`, {
            chat_id: chatId,
            message_id: processingMsg.message_id
        });

        // Decrement the user's quota
        await prisma.user.update({
            where: { telegramId },
            data: { quotaGpt: { decrement: 1 } },
        });

        // Log the GPT request
        await loggingService.logAction(user.id, 'gpt_request', {
            promptLength: prompt.length,
            responseLength: gptResponse.length
        });
        await loggingService.updateLastActive(telegramId);

        // Send quota update
        const remainingQuota = user.quotaGpt - 1;
        if (remainingQuota <= 10) {
            bot.sendMessage(chatId, `⚠️ You have ${remainingQuota} GPT requests remaining.`);
        }

    } catch (error) {
        console.error("❌ GPT command failed:", error);
        bot.sendMessage(chatId, "❌ Sorry, something went wrong with your request. Please try again.");
    }
});

// COMMAND: /fetch <url>
bot.onText(/\/fetch (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const telegramId = BigInt(msg.from.id);
    const rawUrl = match[1];

    // Security checks
    if (!validateTelegramId(telegramId)) {
        return bot.sendMessage(chatId, "❌ Invalid user session. Please restart the bot.");
    }

    // Rate limiting
    if (!checkRateLimit(rateLimitMap, telegramId.toString(), 10, 60000)) { // 10 requests per minute
        return bot.sendMessage(chatId, "⚠️ Slow down! You're sending requests too quickly. Please wait a moment.");
    }

    // Sanitize and validate URL
    const url = sanitizeInput(rawUrl).trim();
    if (!url || url.length < 8) {
        return bot.sendMessage(chatId, "❌ Please provide a valid URL. Example: /fetch https://example.com");
    }

    try {
        const user = await prisma.user.findUnique({ where: { telegramId } });

        if (!user) {
            return bot.sendMessage(chatId, "❌ You need to redeem an access code first. Use /redeem ET-XXXX-XXXX");
        }

        if (user.quotaFetch <= 0) {
            return bot.sendMessage(chatId, "❌ You have no web fetch requests left. Please redeem a new access code or contact your sponsor.");
        }

        // Send processing message
        const processingMsg = await bot.sendMessage(chatId, `🌐 Fetching content from: ${url.substring(0, 50)}${url.length > 50 ? '...' : ''}`);

        // Fetch the webpage content
        const result = await webfetchService.fetchContent(url);

        if (result.success) {
            const response = `🌐 **${result.title}**\n\n${result.content}\n\n🔗 Source: ${url}`;
            
            // Edit the processing message with the content
            await bot.editMessageText(response, {
                chat_id: chatId,
                message_id: processingMsg.message_id
            });

            // Decrement the user's quota
            await prisma.user.update({
                where: { telegramId },
                data: { quotaFetch: { decrement: 1 } },
            });

            // Log the fetch request
            await loggingService.logAction(user.id, 'fetch_request', {
                url: url.substring(0, 200), // Truncate URL for privacy
                success: true,
                contentLength: result.content?.length || 0
            });
            await loggingService.updateLastActive(telegramId);

            // Send quota update if running low
            const remainingQuota = user.quotaFetch - 1;
            if (remainingQuota <= 5) {
                bot.sendMessage(chatId, `⚠️ You have ${remainingQuota} web fetch requests remaining.`);
            }

        } else {
            await bot.editMessageText(`❌ **Failed to fetch content**\n\n${result.error}\n\nPlease check the URL and try again.`, {
                chat_id: chatId,
                message_id: processingMsg.message_id
            });

            // Log failed fetch attempt
            const user = await prisma.user.findUnique({ where: { telegramId } });
            await loggingService.logAction(user.id, 'fetch_request', {
                url: url.substring(0, 200),
                success: false,
                error: result.error
            });
        }

    } catch (error) {
        console.error("❌ Fetch command failed:", error);
        bot.sendMessage(chatId, "❌ Sorry, something went wrong while fetching the webpage. Please try again.");
    }
});

// COMMAND: /image <description>
bot.onText(/\/image (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const telegramId = BigInt(msg.from.id);
    const description = sanitizeInput(match[1]);

    // Security checks
    if (!validateTelegramId(telegramId)) {
        return bot.sendMessage(chatId, "❌ Invalid user session. Please restart the bot.");
    }

    // Rate limiting
    if (!checkRateLimit(rateLimitMap, telegramId.toString(), 5, 60000)) { // 5 images per minute
        return bot.sendMessage(chatId, "⚠️ Image generation is limited. Please wait before requesting another image.");
    }

    if (!description || description.length < 5) {
        return bot.sendMessage(chatId, "❌ Please provide a detailed image description (minimum 5 characters).");
    }

    try {
        const user = await prisma.user.findUnique({ where: { telegramId } });

        if (!user) {
            return bot.sendMessage(chatId, "❌ You need to redeem an access code first. Use /redeem ET-XXXX-XXXX");
        }

        if (user.quotaGpt <= 2) { // Images cost 3 GPT credits
            return bot.sendMessage(chatId, "❌ You need at least 3 GPT credits to generate an image. Current balance: " + user.quotaGpt);
        }

        const processingMsg = await bot.sendMessage(chatId, `🎨 Generating image: "${description}"...\n\nThis may take 10-30 seconds.`);

        const imageUrl = await openaiService.generateImage(description);

        if (imageUrl.startsWith('http')) {
            await bot.deleteMessage(chatId, processingMsg.message_id);
            await bot.sendPhoto(chatId, imageUrl, {
                caption: `🎨 **Generated Image**\n\n**Prompt:** ${description}\n\n*Generated by AI - 3 credits used*`
            });

            // Deduct 3 credits for image generation
            await prisma.user.update({
                where: { telegramId },
                data: { quotaGpt: { decrement: 3 } },
            });

            await loggingService.logAction(user.id, 'image_generation', {
                description: description.substring(0, 200),
                success: true
            });
        } else {
            await bot.editMessageText(`❌ **Image Generation Failed**\n\n${imageUrl}`, {
                chat_id: chatId,
                message_id: processingMsg.message_id
            });
        }

    } catch (error) {
        console.error("❌ Image generation failed:", error);
        bot.sendMessage(chatId, "❌ Sorry, image generation failed. Please try again with a different description.");
    }
});

// COMMAND: /translate <text>
bot.onText(/\/translate (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const telegramId = BigInt(msg.from.id);
    const text = sanitizeInput(match[1]);

    if (!validateTelegramId(telegramId) || !text) {
        return bot.sendMessage(chatId, "❌ Please provide text to translate. Example: /translate Hello, how are you?");
    }

    try {
        const user = await prisma.user.findUnique({ where: { telegramId } });
        if (!user || user.quotaGpt <= 0) {
            return bot.sendMessage(chatId, "❌ You need GPT credits to use translation. Use /redeem to get more credits.");
        }

        const prompt = `Translate the following text to English, Amharic, and one other relevant language. Show each translation clearly labeled:

"${text}"

Format your response as:
🇺🇸 English: [translation]
🇪🇹 Amharic: [translation]
🌍 Other: [translation in detected language]`;

        const translation = await openaiService.getChatCompletion(prompt);
        
        bot.sendMessage(chatId, `🌐 **Translation Service**\n\n${translation}`);

        await prisma.user.update({
            where: { telegramId },
            data: { quotaGpt: { decrement: 1 } },
        });

        await loggingService.logAction(user.id, 'translation', {
            originalText: text.substring(0, 100),
            success: true
        });

    } catch (error) {
        console.error("❌ Translation failed:", error);
        bot.sendMessage(chatId, "❌ Translation failed. Please try again.");
    }
});

// COMMAND: /news <topic>
bot.onText(/\/news(?:\s+(.+))?/, async (msg, match) => {
    const chatId = msg.chat.id;
    const telegramId = BigInt(msg.from.id);
    const topic = match && match[1] ? sanitizeInput(match[1]) : 'latest news';

    if (!validateTelegramId(telegramId)) {
        return bot.sendMessage(chatId, "❌ Invalid user session. Please restart the bot.");
    }

    try {
        const user = await prisma.user.findUnique({ where: { telegramId } });
        if (!user || user.quotaGpt <= 0) {
            return bot.sendMessage(chatId, "❌ You need GPT credits for news summaries. Use /redeem to get more credits.");
        }

        const prompt = `Provide a current news summary about "${topic}". Include:
1. 3-5 recent developments
2. Key facts and context
3. Multiple perspectives when applicable
4. Reliable sources when possible

Keep it informative but concise. If you don't have recent information, explain that and provide general context about the topic.`;

        const processingMsg = await bot.sendMessage(chatId, `📰 Gathering news about: ${topic}...`);
        
        const newsResponse = await openaiService.getChatCompletion(prompt);
        
        await bot.editMessageText(`📰 **News Summary: ${topic}**\n\n${newsResponse}\n\n*Note: AI-generated summary. Please verify important information from multiple sources.*`, {
            chat_id: chatId,
            message_id: processingMsg.message_id
        });

        await prisma.user.update({
            where: { telegramId },
            data: { quotaGpt: { decrement: 1 } },
        });

        await loggingService.logAction(user.id, 'news_request', {
            topic: topic.substring(0, 100),
            success: true
        });

    } catch (error) {
        console.error("❌ News request failed:", error);
        bot.sendMessage(chatId, "❌ Failed to get news summary. Please try again.");
    }
});

// COMMAND: /summarize <url>
bot.onText(/\/summarize (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const telegramId = BigInt(msg.from.id);
    const url = sanitizeInput(match[1]);

    if (!validateTelegramId(telegramId)) {
        return bot.sendMessage(chatId, "❌ Invalid user session. Please restart the bot.");
    }

    try {
        const user = await prisma.user.findUnique({ where: { telegramId } });
        if (!user || user.quotaFetch <= 0 || user.quotaGpt <= 0) {
            return bot.sendMessage(chatId, "❌ You need both fetch and GPT credits to summarize content. Use /redeem to get more credits.");
        }

        const processingMsg = await bot.sendMessage(chatId, `📋 Fetching and summarizing: ${url.substring(0, 50)}...`);

        // First fetch the content
        const fetchResult = await webfetchService.fetchContent(url);
        
        if (!fetchResult.success) {
            return bot.editMessageText(`❌ Failed to fetch content: ${fetchResult.error}`, {
                chat_id: chatId,
                message_id: processingMsg.message_id
            });
        }

        // Then summarize it
        const summary = await openaiService.summarizeText(fetchResult.content);
        
        await bot.editMessageText(`📋 **Summary: ${fetchResult.title}**\n\n${summary}\n\n🔗 **Source:** ${url}`, {
            chat_id: chatId,
            message_id: processingMsg.message_id
        });

        // Deduct both fetch and GPT credits
        await prisma.user.update({
            where: { telegramId },
            data: { 
                quotaFetch: { decrement: 1 },
                quotaGpt: { decrement: 1 }
            },
        });

        await loggingService.logAction(user.id, 'summarize_content', {
            url: url.substring(0, 200),
            success: true
        });

    } catch (error) {
        console.error("❌ Summarize failed:", error);
        bot.sendMessage(chatId, "❌ Failed to summarize content. Please try again.");
    }
});

// COMMAND: /myquota
bot.onText(/\/myquota/, async (msg) => {
    const chatId = msg.chat.id;
    const telegramId = BigInt(msg.from.id);

    try {
        const user = await prisma.user.findUnique({ where: { telegramId } });

        if (!user) {
            return bot.sendMessage(chatId, "You do not have an active account. Please redeem an access code first using the /redeem command.");
        }

        const quotaMessage = `📊 Your Current Quota:\n\n- GPT Requests: ${user.quotaGpt}\n- Web Fetches: ${user.quotaFetch}`;
        bot.sendMessage(chatId, quotaMessage);

    } catch (error) {
        console.error("Quota command failed:", error);
        bot.sendMessage(chatId, "Sorry, I couldn't retrieve your quota at this time.");
    }
});

// COMMAND: /help
bot.onText(/\/help/, (msg) => {
    const chatId = msg.chat.id;
    const helpMessage = `🛡️ **Afelu Guardian - Help & Commands**

**🎯 Getting Started:**
• Get an access code from your sponsor
• Use \`/redeem ET-XXXX-XXXX\` to activate

**🤖 AI Commands:**
• \`/gpt <question>\` - Ask AI anything (1 credit)
• \`/image <description>\` - Generate AI images (3 credits)
• \`/translate <text>\` - Translate text (1 credit)
• \`/news <topic>\` - Get news summary (1 credit)

**🌐 Web Commands:**
• \`/fetch <url>\` - Access websites (1 fetch credit)
• \`/summarize <url>\` - Fetch & summarize (1 fetch + 1 GPT)

**📊 Account Commands:**
• \`/myquota\` - Check remaining credits
• \`/help\` - Show this help message

**💳 Credit System:**
• Each access code gives 500 GPT + 100 fetch credits
• GPT credits: AI chat, images, translation, news
• Fetch credits: Website access and content fetching

**🆘 Support:**
Contact your sponsor or email: support@afelu.com

**🔒 Privacy:** We don't store your conversations or personal data.`;

    bot.sendMessage(chatId, helpMessage, { parse_mode: 'Markdown' });
});

// Export the bot instance and control functions
module.exports = {
    bot,
    startBot,
    setupBotCommands,
    commands
};