require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const prisma = require('./prisma');
const openaiService = require('./services/openai');
const enhancedAI = require('./services/enhanced-ai-service');
const costOptimizedAI = require('./services/cost-optimized-ai');
const webfetchService = require('./services/webfetch');
const loggingService = require('./services/logging');
const certificateService = require('./services/certificate-service');
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

// Initialize cost-optimized AI for startup phase
const costOptimizer = new costOptimizedAI();

// Rate limiting maps
const rateLimitMap = new Map();
const redeemRateLimitMap = new Map();

// Course data structure
const courses = {
    fundamentals: {
        title: "AI Fundamentals: Your Guide to the Future",
        subtitle: "Perfect for beginners - learn what AI is and how it can help you in daily life",
        duration: "2 Weeks",
        description: "Welcome to the world of Artificial Intelligence! This course is designed for absolute beginners with no prior technical knowledge.",
        modules: {
            "1.1": { title: "A Simple Introduction", content: "Defining AI in plain language. The difference between science fiction and reality." },
            "1.2": { title: "A Brief History of AI", content: "Key milestones that led us to today's technology." },
            "1.3": { title: "Types of AI", content: "Understanding Narrow AI, General AI (AGI), and Superintelligence (ASI)." },
            "1.4": { title: "AI in Your Daily Life", content: "Discovering AI in social media, navigation, streaming, and spam filters." },
            "2.1": { title: "Meet Large Language Models", content: "What is an LLM? How does it learn from internet text?" },
            "2.2": { title: "How ChatGPT Works", content: "Understanding how ChatGPT predicts the next word to form sentences." },
            "2.3": { title: "Beyond Text Capabilities", content: "Writing emails, summarizing, brainstorming, translating, and coding." },
            "2.4": { title: "Other AI Tools", content: "AI image generators and other helpful AI assistants." },
            "3.1": { title: "The Power of Good Prompts", content: "Quality output depends on quality input (your instructions)." },
            "3.2": { title: "The CORE Framework", content: "Context, Objective, Role, Example - framework for better prompts." },
            "3.3": { title: "Practical Prompting", content: "Writing prompts for emails, grocery lists, and trip planning." },
            "4.1": { title: "The Black Box Problem", content: "Why we don't always know how AI reaches conclusions." },
            "4.2": { title: "Bias in AI", content: "How AI can learn and repeat human biases from training data." },
            "4.3": { title: "Privacy and Data Security", content: "What information is safe to share with AI systems." },
            "4.4": { title: "Future of Work and Society", content: "How AI might change jobs and importance of responsible development." }
        }
    },
    mastery: {
        title: "ChatGPT Mastery: From Conversation to Creation",
        subtitle: "Advanced techniques for getting the best results from AI conversations",
        duration: "3 Weeks",
        description: "Go beyond basic questions and answers. Learn advanced prompting strategies, creative partnerships, and business automation.",
        modules: {
            "1.1": { title: "Chain-of-Thought Technique", content: "Making AI think step-by-step for complex tasks." },
            "1.2": { title: "Zero-Shot to Few-Shot Prompting", content: "Using examples to guide AI outputs precisely." },
            "1.3": { title: "The Power of Personas", content: "Creating detailed AI personas for specialized tasks." },
            "1.4": { title: "Iterative Prompting", content: "Building upon previous prompts for complex goals." },
            "2.1": { title: "Demanding Formats", content: "Getting outputs in tables, JSON, Markdown, or HTML." },
            "2.2": { title: "Controlling Tone and Style", content: "Prompting for specific writing styles and maintaining consistency." },
            "3.1": { title: "AI as Co-writer", content: "Brainstorming plots, developing characters, overcoming writer's block." },
            "3.2": { title: "Poetry and Songwriting", content: "Generating creative text, rhymes, and lyrical ideas." },
            "3.3": { title: "Script and Dialogue Writing", content: "Drafting scenes and natural-sounding dialogue." },
            "4.1": { title: "Nuanced Translation", content: "Capturing cultural context, idioms, and formality." },
            "4.2": { title: "Language Learning Partner", content: "Practice conversations, grammar explanations, vocabulary." },
            "4.3": { title: "Cross-Cultural Business Communication", content: "Culturally appropriate emails and presentations." },
            "5.1": { title: "AI-Powered Analysis", content: "Summarizing reports, analyzing data, identifying themes." },
            "5.2": { title: "Content Marketing Engine", content: "Blog ideas, social media, video scripts, ad copy." },
            "5.3": { title: "Automating Routine Tasks", content: "Customer inquiries, meeting summaries, project proposals." },
            "6.1": { title: "Understanding APIs", content: "How developers connect ChatGPT to other applications." },
            "6.2": { title: "Third-Party Tools", content: "Browser extensions and apps that use ChatGPT." }
        }
    },
    business: {
        title: "AI for Business: Growth and Innovation in Ethiopian Market",
        subtitle: "Use AI to grow your business, improve productivity, and serve customers better",
        duration: "4 Weeks",
        description: "Practical guide for Ethiopian entrepreneurs using AI for competitive advantage in marketing, customer service, and data analysis.",
        modules: {
            "1.1": { title: "Why AI Now?", content: "Current AI opportunities in Ethiopian business ecosystem." },
            "1.2": { title: "Identifying AI Opportunities", content: "Framework for analyzing business processes for AI implementation." },
            "1.3": { title: "Low-Cost, High-Impact Tools", content: "Accessible AI tools for small and medium enterprises." },
            "2.1": { title: "Ethiopian Tech Startup Case", content: "How local startups use AI for delivery, fintech, and optimization." },
            "2.2": { title: "Problem & Solution Analysis", content: "AI solutions for route optimization, fraud detection, personalization." },
            "2.3": { title: "Tools and Implementation", content: "Types of AI technology successfully implemented locally." },
            "3.1": { title: "AI-Powered Market Research", content: "Analyzing competitors, trends, and customer sentiment." },
            "3.2": { title: "SEO & Content Strategy", content: "Keywords for Ethiopian market and content generation." },
            "3.3": { title: "Compelling Local Copy", content: "Ad copy and content that resonates with Ethiopian audiences." },
            "4.1": { title: "Content Assembly Line", content: "Workflow for AI-drafted content with human editing." },
            "4.2": { title: "Multilingual Content", content: "Creating materials in Amharic, Oromo, English efficiently." },
            "4.3": { title: "Visual Content Ideas", content: "Text-to-image AI for marketing visuals and graphics." },
            "5.1": { title: "AI Chatbots Introduction", content: "24/7 FAQ handling with automated chatbots." },
            "5.2": { title: "Setting Up Simple Chatbots", content: "User-friendly platforms for website and social media." },
            "5.3": { title: "Crafting Right Responses", content: "Training chatbots with business-specific information." },
            "6.1": { title: "Service Industry Case Study", content: "Ethiopian hotels and restaurants using AI for efficiency." },
            "6.2": { title: "Customer Service Innovation", content: "AI for booking management, personalized offers, feedback analysis." },
            "7.1": { title: "AI for Dark Data", content: "Analyzing feedback emails, social comments, call transcripts." },
            "7.2": { title: "Simple Predictive Analytics", content: "Forecasting sales trends based on historical data." },
            "7.3": { title: "Data Analysis Tools", content: "User-friendly tools connecting to spreadsheets for insights." },
            "8.1": { title: "Business Ethics", content: "Data privacy, transparency, avoiding bias in decisions." },
            "8.2": { title: "Starting Small, Scaling Smart", content: "Piloting AI projects with minimal risk." },
            "8.3": { title: "Future of Ethiopian AI Economy", content: "Upcoming trends and opportunities." }
        }
    },
    digital: {
        title: "Digital Literacy: Your Compass for Modern Ethiopian Economy",
        subtitle: "Essential digital skills for navigating the modern Ethiopian economy",
        duration: "2 Weeks", 
        description: "Practical guide to confidently and safely navigate the digital landscape with security, communication, and financial skills.",
        modules: {
            "1.1": { title: "Creating Strong Passwords", content: "Password best practices and benefits of password managers." },
            "1.2": { title: "Spotting Scams and Phishing", content: "Identifying fake emails, SMS, and suspicious social media offers." },
            "1.3": { title: "Protecting Personal Information", content: "Safe information sharing and privacy settings management." },
            "1.4": { title: "Secure Browsing", content: "HTTPS importance, secure Wi-Fi, and VPN basics." },
            "2.1": { title: "Professional Email Etiquette", content: "Clear, professional emails: subject lines, greetings, body, sign-offs." },
            "2.2": { title: "Messaging Apps Effectively", content: "Formal vs informal communication in professional contexts." },
            "2.3": { title: "Video Conferencing Basics", content: "Zoom, Google Meet: muting, screen sharing, professional backgrounds." },
            "2.4": { title: "Building Digital Footprint", content: "Understanding online posts' impact on professional reputation." },
            "3.1": { title: "Google Smarter", content: "Search operators for finding information quickly." },
            "3.2": { title: "Evaluating Information Sources", content: "Checking author, date, purpose; distinguishing news from opinion." },
            "3.3": { title: "Understanding Misinformation", content: "Fake news problem and critical thinking skills." },
            "3.4": { title: "Ethiopian Online Resources", content: "Trusted resources for news, government services, job searching." },
            "4.1": { title: "Mobile Banking and Payments", content: "Basics of mobile money services like Telebirr." },
            "4.2": { title: "Digital Transaction Safety", content: "Secure online payments and protecting financial information." },
            "4.3": { title: "Online Shopping Safely", content: "Vetting sellers and understanding digital payment options." },
            "4.4": { title: "Digital Invoicing", content: "Simple tools for freelancers to track income and expenses." }
        }
    }
};

// Bot command definitions for Telegram
const commands = [
    { command: 'start', description: 'Welcome message and getting started guide' },
    { command: 'help', description: 'Complete list of available commands' },
    { command: 'plans', description: 'View all access plans and pricing options' },
    { command: 'redeem', description: 'Redeem an access code (format: /redeem ET-XXXX-XXXX)' },
    { command: 'gpt', description: 'Ask AI anything (1 credit)' },
    { command: 'image', description: 'Generate AI images (3 credits)' },
    { command: 'fetch', description: 'Access websites and get content (1 fetch credit)' },
    { command: 'translate', description: 'Translate text to multiple languages (1 credit)' },
    { command: 'news', description: 'Get news summaries on any topic (1 credit)' },
    { command: 'summarize', description: 'Fetch and summarize web content (1 fetch + 1 GPT)' },
    { command: 'courses', description: 'Browse available AI courses' },
    { command: 'bootcamp', description: 'Learn about premium AI Training Bootcamp ($299)' },
    { command: 'premium', description: 'Information about premium unlimited access ($79/month)' },
    { command: 'enterprise', description: 'Custom AI solutions for businesses ($5K+)' },
    { command: 'enroll', description: 'Enroll in a course (format: /enroll fundamentals)' },
    { command: 'lesson', description: 'Get specific lesson content (format: /lesson 1.1)' },
    { command: 'complete', description: 'Mark a lesson as completed (format: /complete 1.1 fundamentals)' },
    { command: 'progress', description: 'Check your learning progress' },
    { command: 'quiz', description: 'Take a practice quiz for current lesson' },
    { command: 'score', description: 'Submit quiz score for certificate (format: /score 85 fundamentals)' },
    { command: 'certificates', description: 'View your earned certificates' },
    { command: 'verify', description: 'Verify a certificate (format: /verify AFC-2025-123456)' },
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
        // Check if we're in production environment
        if (process.env.NODE_ENV === 'production' && process.env.WEBHOOK_URL) {
            // Use webhook mode in production
            console.log("🔗 Setting up webhook for production...");
            const webhookUrl = `${process.env.WEBHOOK_URL}/bot${token}`;
            bot.setWebHook(webhookUrl);
            console.log(`✅ Bot webhook set to: ${webhookUrl}`);
        } else {
            // Use polling for development
            bot.startPolling({ restart: true });
            console.log("✅ Bot polling started");
        }
        setupBotCommands(); // Register commands after starting
    } catch (error) {
        console.error("❌ Failed to start bot:", error.message);
    }
}

// COMMAND: /start
bot.onText(/\/start/, (msg) => {
    const welcomeMessage = `🛡️ **Welcome to Afelu Guardian AI Platform!**

*🇪🇹 Ethiopia's Leading AI Education & Services Platform*

**🎯 WHAT WE OFFER:**

**👥 FOR FAMILIES & INDIVIDUALS:**
• AI tools access for daily use (ChatGPT, image generation, translation)
• Free comprehensive AI education courses  
• Website access and news summaries
• Perfect for diaspora-sponsored family members

**💼 FOR PROFESSIONALS & BUSINESSES:**
• Advanced AI training and certification
• Premium unlimited AI access
• 1-on-1 mentoring and consultation
• Custom enterprise AI solutions

**🚀 QUICK START GUIDE:**

**Option 1 - Family/Individual Access:**
1. Get an access code from your sponsor
2. Use \`/redeem ET-XXXX-XXXX\` to activate
3. Start learning with \`/courses\` and practice with \`/gpt\`

**Option 2 - Professional/Premium:**
1. Contact us for premium plans: support@afelu.com
2. Choose from bootcamp ($299), premium monthly ($79), or enterprise solutions
3. Get advanced training and unlimited access

**🎓 LEARNING PATHS:**
• \`/courses\` - Browse 4 free comprehensive AI courses
• \`/bootcamp\` - Learn about our premium $299 intensive program
• \`/plans\` - See all access plans and pricing

**🔧 AI TOOLS:**
• \`/gpt <question>\` - Ask AI anything
• \`/image <description>\` - Generate images with AI
• \`/translate <text>\` - Translate between languages
• \`/news <topic>\` - Get latest news summaries

Start your AI journey today! Choose your path above 🎯`;

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

        // Get AI response using cost-optimized service
        const aiResult = await costOptimizer.getResponse(prompt, 'simple');
        const gptResponse = aiResult.text;
        
        // Edit the processing message with the response
        const statusEmoji = aiResult.cached ? '💰' : '🤖';
        const statusText = aiResult.cached ? '**Cached Response** (Instant)' : '**AI Response**';
        
        await bot.editMessageText(`${statusEmoji} ${statusText}\n\n${gptResponse}`, {
            chat_id: chatId,
            message_id: processingMsg.message_id
        });

        // Decrement the user's quota
        await prisma.user.update({
            where: { telegramId },
            data: { quotaGpt: { decrement: 1 } },
        });

        // Log the GPT request with optimization data
        await loggingService.logAction(user.id, 'gpt_request', {
            promptLength: prompt.length,
            responseLength: gptResponse.length,
            cached: aiResult.cached,
            provider: aiResult.provider,
            estimatedCost: aiResult.cost
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

        const aiResult = await costOptimizer.getResponse(prompt, 'simple');
        const translation = aiResult.text;
        
        const statusEmoji = aiResult.cached ? '💰🌐' : '🌐';
        const statusText = aiResult.cached ? '**Translation Service** (Cached)' : '**Translation Service**';
        
        bot.sendMessage(chatId, `${statusEmoji} ${statusText}\n\n${translation}`);

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
        
        const aiResult = await costOptimizer.getResponse(prompt, 'simple');
        const newsResponse = aiResult.text;
        
        const statusEmoji = aiResult.cached ? '💰📰' : '📰';
        const cacheNote = aiResult.cached ? ' (Cached)' : '';
        
        await bot.editMessageText(`${statusEmoji} **News Summary: ${topic}**${cacheNote}\n\n${newsResponse}\n\n*Note: AI-generated summary. Please verify important information from multiple sources.*`, {
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
    const helpMessage = `🛡️ **Afelu Guardian - Complete Command Guide**

**🎯 GETTING STARTED:**
• \`/redeem ET-XXXX-XXXX\` - Activate your access code (for family/individual plans)
• \`/plans\` - View all access plans and pricing
• \`/myquota\` - Check your remaining credits

**🤖 AI TOOLS (1-3 credits each):**
• \`/gpt <question>\` - Ask AI anything (1 credit)
• \`/image <description>\` - Generate AI images (3 credits)
• \`/translate <text>\` - Translate text between languages (1 credit)
• \`/news <topic>\` - Get latest news summaries (1 credit)

**🌐 WEB ACCESS (1-2 credits each):**
• \`/fetch <url>\` - Access websites and content (1 fetch credit)
• \`/summarize <url>\` - Fetch & summarize web content (1 fetch + 1 GPT)

**📚 AI EDUCATION (FREE with access code):**
• \`/courses\` - Browse 4 comprehensive AI courses
• \`/enroll <course>\` - Enroll in a specific course
• \`/lesson <number>\` - Access lesson content
• \`/progress\` - Check your learning progress
• \`/quiz\` - Take practice quizzes

**🏆 PREMIUM TRAINING:**
• \`/bootcamp\` - Learn about $299 intensive AI training program
• \`/premium\` - Information about $79/month unlimited access
• \`/enterprise\` - Custom AI solutions for businesses

**💳 ACCESS PLANS:**
• **Weekly Code**: $5 (perfect for trying AI tools)
• **Family Plan**: $25/month (4 family members)
• **Community Plan**: $50/month (support 10 people)
• **Premium Access**: $79/month (unlimited AI tools + priority support)
• **AI Bootcamp**: $299 (4-week intensive training + certification)
• **Enterprise**: $5K+ (custom AI implementation)

**📊 CREDIT SYSTEM:**
• Standard access codes: 500 GPT + 100 fetch credits
• Premium plans: Unlimited usage
• Credits refresh with new codes or subscriptions

**🆘 SUPPORT:**
• Email: support@afelu.com
• Website: https://afelu.com
• Payment issues, course questions, or technical support

**🔒 PRIVACY & SECURITY:**
• We don't store your conversations or personal data
• All interactions are encrypted and secure
• Access codes are single-use and time-limited

**� RECOMMENDED PATHS:**

**For Individuals/Families:**
1. Get access code → \`/redeem\` → \`/courses\` → Start learning!

**For Professionals:**
1. \`/bootcamp\` or \`/premium\` → Contact support@afelu.com → Advanced training

**For Businesses:**
1. \`/enterprise\` → Contact for consultation → Custom AI solutions`;

    bot.sendMessage(chatId, helpMessage, { parse_mode: 'Markdown' });
});

// COMMAND: /courses
bot.onText(/\/courses/, (msg) => {
    const chatId = msg.chat.id;
    const coursesMessage = `📚 **Afelu Guardian AI Education Catalog**

**🆓 FREE COMPREHENSIVE COURSES (With Access Code):**

🎓 **1. AI Fundamentals** (\`fundamentals\`)
${courses.fundamentals.subtitle}
⏱️ Duration: ${courses.fundamentals.duration}
🎯 Perfect for: Complete beginners to AI

🚀 **2. ChatGPT Mastery** (\`mastery\`)
${courses.mastery.subtitle}
⏱️ Duration: ${courses.mastery.duration}
🎯 Perfect for: Users wanting advanced AI skills

💼 **3. AI for Business** (\`business\`)
${courses.business.subtitle}
⏱️ Duration: ${courses.business.duration}
🎯 Perfect for: Entrepreneurs and business owners

💻 **4. Digital Literacy** (\`digital\`)
${courses.digital.subtitle}
⏱️ Duration: ${courses.digital.duration}
🎯 Perfect for: Building essential digital skills

**💎 PREMIUM PROFESSIONAL TRAINING:**

🏆 **AI Training Bootcamp** - **$299**
*The Ultimate 4-Week Intensive Program for Professionals*
⏱️ Duration: 4 Weeks Intensive
🎯 Features: Advanced prompt engineering, business automation, 1-on-1 mentoring, professional certification
💼 Perfect for: Working professionals, consultants, advanced practitioners
📞 Enrollment: [Buy now](https://buy.stripe.com/test_7sY9ASftP5pG9lT1VxcjS01) or use \`/bootcamp\` for details

**🚀 GETTING STARTED:**

**Option 1 - Free Learning (Family/Individual):**
1. Get access code from sponsor → \`/redeem ET-XXXX-XXXX\`
2. Start with \`/enroll fundamentals\` 
3. Practice with \`/gpt\`, \`/image\`, \`/translate\` as you learn
4. Progress through: fundamentals → mastery → business → digital

**Option 2 - Professional Training:**
1. Check out \`/bootcamp\` for intensive professional program
2. Or try \`/premium\` for unlimited AI access
3. Contact support@afelu.com for enrollment

**💡 RECOMMENDED LEARNING PATHS:**

**🎯 For Complete Beginners:**
AI Fundamentals → Digital Literacy → ChatGPT Mastery → AI for Business

**🎯 For Professionals:**
AI Fundamentals → ChatGPT Mastery → AI for Business → AI Training Bootcamp

**🎯 For Business Owners:**
AI for Business → ChatGPT Mastery → AI Training Bootcamp → Enterprise Solutions

**📊 COURSE FEATURES:**
✅ Interactive lessons via Telegram bot
✅ Hands-on practice with real AI tools
✅ Progress tracking and quizzes
✅ Professional certificates upon completion
✅ Ethiopian context and practical applications
✅ Learn at your own pace, available 24/7

**🎁 ALL FREE COURSES INCLUDED:**
With any access code purchase! No additional fees.

Ready to start your AI journey? 🚀`;

    bot.sendMessage(chatId, coursesMessage, { parse_mode: 'Markdown' });
});

// COMMAND: /bootcamp
bot.onText(/\/bootcamp/, (msg) => {
    const chatId = msg.chat.id;
    const bootcampMessage = `🏆 **AI Training Bootcamp - Premium Professional Course**

**💎 THE ULTIMATE 4-WEEK INTENSIVE PROGRAM**
*For Professionals and Innovators - $299*

**📋 WHAT'S INCLUDED:**
✅ 4-week intensive professional training program
✅ Advanced ChatGPT and prompt engineering mastery
✅ Business automation strategies and workflows
✅ Industry-specific AI applications
✅ **Two 1-on-1 mentoring sessions** with AI experts
✅ Hands-on capstone project with ROI documentation
✅ **Professional Certification of Completion**
✅ **Lifetime access** to all materials and future updates

**🎯 PROGRAM STRUCTURE:**

**Week 1:** Mastering Advanced AI Interaction & Prompt Engineering
• Chain-of-Thought, Tree of Thoughts, Self-Correction techniques
• Structured output mastery (JSON, XML, Markdown)
• Meta-prompting and prompt chaining for complex tasks
• Ultra-detailed persona development and contextual priming

**Week 2:** Business Automation Strategies  
• Unstructured data analysis and sentiment analysis
• End-to-end marketing campaign automation
• Sales funnel automation and personalized follow-ups
• HR process streamlining and documentation automation

**Week 3:** Industry-Specific Applications
• Tech & Software Development AI solutions
• Marketing & Creative professional applications  
• Business & Finance automation and analysis
• Healthcare & Academia research and documentation

**Week 4:** Integration, Final Project & Certification
• API integration and no-code automation platforms
• Capstone project implementation and ROI documentation
• Ethical AI framework for professional environments
• Professional certification upon successful completion

**🎓 CERTIFICATION VALUE:**
• Professional-level certificate (AFCP-2025-XXXXXX)
• Validates 40+ hours of advanced training
• Recognized credential for LinkedIn and resumes
• Demonstrates leadership-ready AI expertise

**👥 WHO THIS IS FOR:**
• Working professionals seeking AI expertise
• Entrepreneurs wanting to automate business processes
• Managers leading digital transformation initiatives
• Consultants adding AI services to their offerings

**💰 INVESTMENT:** $299 (One-time payment)
**🎁 VALUE:** $2000+ in training, mentorship, and lifetime access

**📞 ENROLLMENT:**
This premium course requires separate enrollment.
Contact us: support@afelu.com or visit afelu.com/bootcamp

**🆓 START FIRST:** Try our free courses to see if you're ready:
\`/enroll fundamentals\` → \`/enroll mastery\` → \`/enroll business\`

Ready to become an AI power user? 🚀`;

    bot.sendMessage(chatId, bootcampMessage, { parse_mode: 'Markdown' });
});

// COMMAND: /plans
bot.onText(/\/plans/, (msg) => {
    const chatId = msg.chat.id;
    const plansMessage = `💎 **Afelu Guardian - All Access Plans & Pricing**

**👥 FAMILY & COMMUNITY ACCESS:**

🟢 **Weekly Access Code - $5**
• Perfect for trying AI tools
• 500 GPT credits + 100 fetch credits
• Access to all 4 free courses
• Valid for 7 days
• **Purchase:** Email support@afelu.com

🔵 **Family Plan - $25/month**
• For 4 family members in Ethiopia
• Unlimited access to AI tools and courses
• Ongoing support and updates
• **Purchase:** [Click here](https://buy.stripe.com/test_eVq9AS0yV05m69HfMncjS03)

🟣 **Community Plan - $50/month**
• Support 10 people in your community
• Bulk access management
• Priority community support
• **Purchase:** Email support@afelu.com

**💼 PROFESSIONAL & BUSINESS ACCESS:**

🥇 **Premium Access - $79/month**
• Unlimited AI tools (no credit limits)
• Priority support and faster response
• Early access to new features
• Advanced automation tools
• **Purchase:** [Click here](https://buy.stripe.com/test_cNi6oGdlH2du7dL0RtcjS00)

🏆 **AI Training Bootcamp - $299** (One-time)
• 4-week intensive professional program
• Advanced prompt engineering and automation
• Two 1-on-1 mentoring sessions
• Professional certification (AFCP-2025-XXXXXX)
• Lifetime access and updates
• **Purchase:** [Click here](https://buy.stripe.com/test_7sY9ASftP5pG9lT1VxcjS01)

🏢 **Enterprise Solutions - $5K+**
• Custom AI implementation for your business
• Dedicated support team and consultation
• Integration with existing business systems
• Training for your entire team
• **Contact:** support@afelu.com for consultation

**🎯 WHICH PLAN IS RIGHT FOR YOU?**

**Students/Individuals:** Weekly Access ($5) or Family Plan ($25/mo)
**Professionals:** Premium Access ($79/mo) or AI Bootcamp ($299)
**Businesses:** Enterprise Solutions ($5K+)

**📞 NEED HELP CHOOSING?**
Contact us: support@afelu.com
Website: https://afelu.com
All plans include access to our comprehensive AI courses!`;

    bot.sendMessage(chatId, plansMessage, { parse_mode: 'Markdown' });
});

// COMMAND: /premium
bot.onText(/\/premium/, (msg) => {
    const chatId = msg.chat.id;
    const premiumMessage = `🥇 **Premium Access - Unlimited AI Power**

**💎 UNLIMITED AI TOOLS ACCESS - $79/month**

**🚀 WHAT'S INCLUDED:**
✅ **Unlimited GPT requests** (no credit limits)
✅ **Unlimited image generation** (no restrictions)
✅ **Unlimited web fetching** and summarization
✅ **Priority support** with faster response times
✅ **Early access** to new AI features and tools
✅ **Advanced automation** tools and workflows
✅ **All 4 comprehensive AI courses** included
✅ **Progress tracking** and personalized learning paths

**🎯 PERFECT FOR:**
• Heavy AI users who need unlimited access
• Professionals using AI for daily work
• Content creators and marketers
• Researchers and analysts
• Anyone wanting priority support

**💰 PRICING:** $79/month
**🎁 VALUE:** Save on per-use credits, unlimited usage

**🆚 VS STANDARD ACCESS:**
• Standard: 500 GPT + 100 fetch credits per code
• Premium: **UNLIMITED** usage of all tools
• Standard: Basic support
• Premium: **Priority support** with dedicated help
• Standard: Regular feature access
• Premium: **Early access** to new capabilities

**📞 GET PREMIUM ACCESS:**
• **Purchase:** [Click here](https://buy.stripe.com/test_cNi6oGdlH2du7dL0RtcjS00)
• **Questions:** support@afelu.com
• **Website:** https://afelu.com

**🆓 TRY FIRST:** Use \`/redeem\` with an access code to try our tools before upgrading!

Ready for unlimited AI power? 🚀`;

    bot.sendMessage(chatId, premiumMessage, { parse_mode: 'Markdown' });
});

// COMMAND: /enterprise
bot.onText(/\/enterprise/, (msg) => {
    const chatId = msg.chat.id;
    const enterpriseMessage = `🏢 **Enterprise AI Solutions - Custom Implementation**

**🚀 TRANSFORM YOUR BUSINESS WITH AI - Starting at $5,000**

**🎯 WHAT WE PROVIDE:**

**📋 AI STRATEGY & CONSULTATION:**
✅ Complete AI readiness assessment
✅ Custom AI strategy development
✅ ROI analysis and implementation roadmap
✅ Technology stack recommendations

**🔧 CUSTOM AI IMPLEMENTATION:**
✅ Tailored AI tools for your specific business needs
✅ Integration with existing business systems
✅ Custom chatbots and automation workflows
✅ Data analysis and predictive insights setup

**👥 TEAM TRAINING & SUPPORT:**
✅ Comprehensive team training programs
✅ Dedicated account manager and support team
✅ Ongoing consultation and optimization
✅ Performance monitoring and reporting

**🎓 ENTERPRISE EDUCATION PROGRAMS:**
✅ Custom training curriculum for your industry
✅ Group workshops and seminars
✅ Executive briefings on AI strategy
✅ Professional certification programs for staff

**💼 PERFECT FOR:**
• Medium to large businesses (50+ employees)
• Organizations undergoing digital transformation
• Companies wanting competitive AI advantage
• Government agencies and institutions
• Educational institutions and universities

**🏭 INDUSTRY EXPERTISE:**
• Manufacturing & Supply Chain
• Healthcare & Medical Services
• Financial Services & Banking
• Retail & E-commerce
• Education & Training
• Government & Public Sector

**💰 INVESTMENT:** Starting at $5,000
**⏱️ TIMELINE:** 2-6 months implementation
**🎁 INCLUDES:** Strategy, implementation, training, ongoing support

**📞 GET STARTED:**
• **Consultation:** support@afelu.com
• **Website:** https://afelu.com/enterprise
• **Phone:** Schedule a call with our AI specialists

**📋 CONSULTATION PROCESS:**
1. **Discovery Call** - Understand your needs (Free)
2. **AI Assessment** - Analyze your current systems
3. **Proposal** - Custom solution and pricing
4. **Implementation** - Deploy and integrate AI tools
5. **Training** - Educate your team
6. **Support** - Ongoing optimization and support

Transform your business with AI today! 🚀`;

    bot.sendMessage(chatId, enterpriseMessage, { parse_mode: 'Markdown' });
});

// COMMAND: /enroll <course>
bot.onText(/\/enroll (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const telegramId = BigInt(msg.from.id);
    const courseName = sanitizeInput(match[1]).toLowerCase();

    if (!validateTelegramId(telegramId)) {
        return bot.sendMessage(chatId, "❌ Invalid user session. Please restart the bot.");
    }

    try {
        const user = await prisma.user.findUnique({ where: { telegramId } });
        if (!user) {
            return bot.sendMessage(chatId, "❌ You need to redeem an access code first. Use /redeem ET-XXXX-XXXX");
        }

        if (!courses[courseName]) {
            return bot.sendMessage(chatId, `❌ Course not found. Available courses: fundamentals, mastery, business, digital\n\nUse /courses to see all available courses.`);
        }

        const course = courses[courseName];
        const enrollMessage = `✅ **Enrolled in ${course.title}!**

📖 **Course Overview:**
${course.description}

⏱️ **Duration:** ${course.duration}

**🚀 How to Start Learning:**
• Use \`/lesson 1.1\` to start with the first lesson
• Use \`/progress\` to track your advancement
• Use \`/quiz\` to test your knowledge

**📋 Available Lessons:**
${Object.keys(course.modules).slice(0, 4).map(key => `• Lesson ${key}: ${course.modules[key].title}`).join('\n')}
• ... and ${Object.keys(course.modules).length - 4} more lessons

**💡 Tip:** Take your time and practice with real examples using our AI tools!

Ready to start? Type \`/lesson 1.1\` now! 🎯`;

        bot.sendMessage(chatId, enrollMessage, { parse_mode: 'Markdown' });

        // Log enrollment
        await loggingService.logAction(user.id, 'course_enrollment', {
            courseName: courseName,
            courseTitle: course.title
        });

    } catch (error) {
        console.error("❌ Enroll command failed:", error);
        bot.sendMessage(chatId, "❌ Sorry, something went wrong with enrollment. Please try again.");
    }
});

// COMMAND: /lesson <number>
bot.onText(/\/lesson (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const telegramId = BigInt(msg.from.id);
    const lessonNumber = sanitizeInput(match[1]);

    if (!validateTelegramId(telegramId)) {
        return bot.sendMessage(chatId, "❌ Invalid user session. Please restart the bot.");
    }

    try {
        const user = await prisma.user.findUnique({ where: { telegramId } });
        if (!user) {
            return bot.sendMessage(chatId, "❌ You need to redeem an access code first. Use /redeem ET-XXXX-XXXX");
        }

        // Find lesson across all courses
        let foundLesson = null;
        let foundCourse = null;
        
        for (const [courseKey, course] of Object.entries(courses)) {
            if (course.modules[lessonNumber]) {
                foundLesson = course.modules[lessonNumber];
                foundCourse = course;
                break;
            }
        }

        if (!foundLesson) {
            return bot.sendMessage(chatId, `❌ Lesson ${lessonNumber} not found. \n\nExample: /lesson 1.1 for the first lesson\n\nUse /courses to see available courses and enroll first.`);
        }

        const lessonMessage = `📖 **Lesson ${lessonNumber}: ${foundLesson.title}**

📚 **Course:** ${foundCourse.title}

**📝 Content:**
${foundLesson.content}

**🎯 Practice Suggestions:**
• Try asking our AI: \`/gpt ${foundLesson.title} - can you give me an example?\`
• Test your understanding: \`/quiz\`
• Move to next lesson or explore related topics

**💡 Pro Tip:** Apply this knowledge immediately! Use \`/gpt\`, \`/image\`, or \`/translate\` to practice what you just learned.

**📈 Continue Learning:**
• Use \`/progress\` to see your advancement
• Use \`/courses\` to explore other courses`;

        bot.sendMessage(chatId, lessonMessage, { parse_mode: 'Markdown' });

        // Log lesson access
        await loggingService.logAction(user.id, 'lesson_access', {
            lessonNumber: lessonNumber,
            lessonTitle: foundLesson.title
        });

    } catch (error) {
        console.error("❌ Lesson command failed:", error);
        bot.sendMessage(chatId, "❌ Sorry, something went wrong accessing the lesson. Please try again.");
    }
});

// COMMAND: /progress
bot.onText(/\/progress/, async (msg) => {
    const chatId = msg.chat.id;
    const telegramId = BigInt(msg.from.id);

    try {
        const user = await prisma.user.findUnique({ where: { telegramId } });
        if (!user) {
            return bot.sendMessage(chatId, "❌ You need to redeem an access code first. Use /redeem ET-XXXX-XXXX");
        }

        const progressMessage = `📊 **Your Learning Progress**

**🎓 AI Learning Journey:**
• Course enrollments available via \`/enroll\`
• Lessons accessed: Check with \`/lesson <number>\`
• Practice exercises: Use our AI tools

**📈 Usage Statistics:**
• GPT Requests Used: Interactive learning and practice
• Web Fetches Used: Research and real-world application
• Current Balance: ${user.quotaGpt} GPT + ${user.quotaFetch} fetch credits

**🚀 Recommended Next Steps:**
1. **Start with basics:** \`/enroll fundamentals\` then \`/lesson 1.1\`
2. **Practice immediately:** Use \`/gpt\` to ask follow-up questions
3. **Apply knowledge:** Try \`/image\`, \`/translate\`, or \`/news\` commands
4. **Track learning:** Return here to see your progress

**💡 Study Tip:** The best way to learn AI is by using it! Each lesson should be followed by hands-on practice with our tools.

Ready to continue? Use \`/courses\` to explore or \`/lesson <number>\` to study! 🎯`;

        bot.sendMessage(chatId, progressMessage, { parse_mode: 'Markdown' });

    } catch (error) {
        console.error("❌ Progress command failed:", error);
        bot.sendMessage(chatId, "❌ Sorry, couldn't retrieve your progress. Please try again.");
    }
});

// COMMAND: /complete <lesson> <course>
bot.onText(/\/complete (.+) (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const telegramId = BigInt(msg.from.id);
    const lessonNumber = sanitizeInput(match[1]);
    const courseKey = sanitizeInput(match[2]);

    try {
        const user = await prisma.user.findUnique({ where: { telegramId } });
        if (!user) {
            return bot.sendMessage(chatId, "❌ You need to redeem an access code first. Use /redeem ET-XXXX-XXXX");
        }

        // Validate course and lesson exist
        const course = courses[courseKey];
        if (!course) {
            return bot.sendMessage(chatId, `❌ Course "${courseKey}" not found.\n\n**Available courses:**\n• fundamentals\n• chatgpt_mastery\n• ai_business\n• digital_literacy\n\n**Usage:** \`/complete 1.1 fundamentals\``);
        }

        if (!course.modules[lessonNumber]) {
            return bot.sendMessage(chatId, `❌ Lesson ${lessonNumber} not found in ${course.title}.\n\n**Example:** \`/complete 1.1 fundamentals\`\n\nUse \`/lesson ${lessonNumber}\` to check if the lesson exists.`);
        }

        // Mark module as complete
        const result = await certificateService.markModuleComplete(user.id, courseKey, lessonNumber);
        
        if (!result.success) {
            return bot.sendMessage(chatId, "❌ Sorry, couldn't mark lesson as complete. Please try again.");
        }

        const completion = result.completion;
        const progressBar = "█".repeat(Math.floor(completion.completionPercentage / 10)) + 
                           "░".repeat(10 - Math.floor(completion.completionPercentage / 10));

        let message = `✅ **Lesson ${lessonNumber} Completed!**\n\n`;
        message += `📚 **Course:** ${course.title}\n`;
        message += `📖 **Lesson:** ${course.modules[lessonNumber].title}\n\n`;
        message += `**📊 Progress:**\n`;
        message += `${progressBar} ${completion.completionPercentage.toFixed(1)}%\n`;
        message += `Completed: ${completion.completedModules}/${completion.totalModules} lessons\n\n`;

        if (completion.completionPercentage >= 80) {
            message += `🎉 **Congratulations!** You've completed 80% of the course!\n\n`;
            message += `**📋 To earn your certificate:**\n`;
            message += `1. Take the final quiz: \`/quiz\`\n`;
            message += `2. Score 70% or higher\n`;
            message += `3. Certificate will be automatically issued\n\n`;
        } else {
            const remaining = completion.totalModules - completion.completedModules;
            message += `**🚀 Keep Going!**\n`;
            message += `• ${remaining} lessons remaining\n`;
            message += `• Need ${Math.max(0, Math.ceil(completion.totalModules * 0.8) - completion.completedModules)} more for certificate eligibility\n\n`;
        }

        message += `**📈 Next Steps:**\n`;
        message += `• Continue: \`/lesson <next_number>\`\n`;
        message += `• Practice: \`/gpt\`, \`/image\`, \`/translate\`\n`;
        message += `• Track progress: \`/progress\``;

        bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });

        // Log completion
        await loggingService.logAction(user.id, 'lesson_completed', {
            lessonNumber,
            courseKey,
            completionPercentage: completion.completionPercentage
        });

    } catch (error) {
        console.error("❌ Complete command failed:", error);
        bot.sendMessage(chatId, "❌ Sorry, couldn't mark lesson as complete. Please try again.");
    }
});

// COMMAND: /quiz  
bot.onText(/\/quiz (.+)?/, async (msg, match) => {
    const chatId = msg.chat.id;
    const telegramId = BigInt(msg.from.id);
    const courseKey = match && match[1] ? sanitizeInput(match[1]) : null;

    if (!validateTelegramId(telegramId)) {
        return bot.sendMessage(chatId, "❌ Invalid user session. Please restart the bot.");
    }

    try {
        const user = await prisma.user.findUnique({ where: { telegramId } });
        if (!user || user.quotaGpt <= 0) {
            return bot.sendMessage(chatId, "❌ You need GPT credits to take quizzes. Use /redeem to get more credits.");
        }

        let quizPrompt = `Create a comprehensive 5-question multiple choice quiz about AI fundamentals for beginners. Include:

1. One question about what AI is and its basic definition
2. One question about ChatGPT/Large Language Models and how they work
3. One question about practical AI applications in daily life
4. One question about AI ethics, safety, or responsible usage
5. One question about prompting techniques or getting better AI results

For each question:
- Provide 4 options (A, B, C, D)
- Make questions educational and relevant for Ethiopian learners
- Include the correct answer at the end with brief explanations
- Score as: Question 1: A, Question 2: C, etc.

Make it challenging but fair for someone who completed the AI fundamentals course.`;

        if (courseKey && courses[courseKey]) {
            quizPrompt = `Create a final assessment quiz for the "${courses[courseKey].title}" course. This quiz should test comprehensive understanding of all key concepts covered in the course. Include 5 multiple choice questions that:

1. Test understanding of core AI concepts from the course
2. Evaluate practical application knowledge  
3. Check ethical AI usage understanding
4. Test hands-on skills learned
5. Verify real-world application ability

Provide A, B, C, D options for each question and include correct answers with explanations at the end. This is a final exam for certificate eligibility.`;
        }

        const processingMsg = await bot.sendMessage(chatId, "🧠 Generating your AI quiz...");
        
        const aiResult = await costOptimizer.getResponse(quizPrompt, 'simple');
        const quiz = aiResult.text;
        
        let quizMessage = `🧠 **AI Knowledge Quiz**${aiResult.cached ? ' (Cached)' : ''}\n\n${quiz}\n\n**🎯 How to Take This Quiz:**\n• Think carefully about each question\n• Check your answers at the bottom\n• Count your correct answers\n• Use \`/gpt\` to ask about confusing concepts\n\n`;
        
        if (courseKey) {
            quizMessage += `**🏆 Certificate Opportunity:**\nThis is a final quiz for ${courses[courseKey].title}. Score 70% or higher (4/5 correct) to earn your certificate!\n\n`;
            quizMessage += `**📋 After taking the quiz:**\nReply with your score using: \`/score <your_score> ${courseKey}\`\nExample: \`/score 85 fundamentals\`\n\n`;
        }
        
        quizMessage += `**💡 Next Steps:**\n• Review lessons: \`/lesson <number>\`\n• Practice more: \`/gpt\`, \`/translate\`, or \`/image\`\n• Continue learning: \`/courses\``;

        await bot.editMessageText(quizMessage, {
            chat_id: chatId,
            message_id: processingMsg.message_id,
            parse_mode: 'Markdown'
        });

        await prisma.user.update({
            where: { telegramId },
            data: { quotaGpt: { decrement: 1 } },
        });

        await loggingService.logAction(user.id, 'quiz_taken', {
            success: true,
            courseKey: courseKey || 'general'
        });

    } catch (error) {
        console.error("❌ Quiz command failed:", error);
        bot.sendMessage(chatId, "❌ Sorry, couldn't generate quiz. Please try again.");
    }
});

// COMMAND: /score <score> <course>
bot.onText(/\/score (\d+) (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const telegramId = BigInt(msg.from.id);
    const score = parseInt(match[1]);
    const courseKey = sanitizeInput(match[2]);

    try {
        const user = await prisma.user.findUnique({ where: { telegramId } });
        if (!user) {
            return bot.sendMessage(chatId, "❌ You need to redeem an access code first. Use /redeem ET-XXXX-XXXX");
        }

        // Validate course exists
        const course = courses[courseKey];
        if (!course) {
            return bot.sendMessage(chatId, `❌ Course "${courseKey}" not found.\n\n**Available courses:**\n• fundamentals\n• chatgpt_mastery\n• ai_business\n• digital_literacy`);
        }

        // Validate score range
        if (score < 0 || score > 100) {
            return bot.sendMessage(chatId, "❌ Score must be between 0 and 100.\n\n**Example:** `/score 85 fundamentals`");
        }

        // Record the quiz score
        await certificateService.recordQuizScore(user.id, courseKey, score);

        let message = `📊 **Quiz Score Recorded**\n\n`;
        message += `🎯 **Score:** ${score}%\n`;
        message += `📚 **Course:** ${course.title}\n\n`;

        // Check if eligible for certificate
        const completion = await certificateService.checkCourseCompletion(user.id, courseKey);
        
        if (score >= 70 && completion.completed) {
            // Issue certificate automatically
            const certResult = await certificateService.issueCertificate(user.id, courseKey, score);
            
            if (certResult.success) {
                message += `🎉 **CONGRATULATIONS!**\n\n`;
                message += `✅ You've earned your certificate!\n\n`;
                message += `🏆 **Certificate Details:**\n`;
                message += `• Course: ${certResult.courseInfo.title}\n`;
                message += `• Score: ${score}%\n`;
                message += `• Certificate ID: \`${certResult.certificate.certificateId}\`\n`;
                message += `• Issued: ${new Date().toLocaleDateString()}\n\n`;
                message += `**📋 Your Achievement:**\n`;
                message += certificateService.generateCertificateText(
                    certResult.certificate, 
                    certResult.courseInfo
                );
                message += `\n\n**🔗 Share Your Success:**\n`;
                message += `• View all certificates: \`/certificates\`\n`;
                message += `• Verify this certificate: \`/verify ${certResult.certificate.certificateId}\`\n`;
                message += `• Continue learning: \`/courses\``;
            } else if (certResult.reason === 'already_issued') {
                message += `ℹ️ **Certificate Already Issued**\n\n`;
                message += `You already have a certificate for this course.\n`;
                message += `View it with: \`/certificates\`\n\n`;
                message += `**Continue Learning:**\n`;
                message += `• Explore other courses: \`/courses\`\n`;
                message += `• Take advanced courses to earn more certificates`;
            } else {
                message += `❌ **Certificate Issuance Failed**\n\n`;
                message += `Your score qualifies you for a certificate, but there was an error issuing it. Please contact support.\n\n`;
                message += `**Your Progress:**\n`;
                message += `• Score: ${score}% ✅\n`;
                message += `• Course completion: ${completion.completionPercentage.toFixed(1)}% ✅`;
            }
        } else if (score >= 70) {
            message += `🎯 **Great Score!** You passed the quiz!\n\n`;
            message += `**📋 Certificate Eligibility:**\n`;
            message += `• Quiz score: ${score}% ✅ (70%+ required)\n`;
            message += `• Course completion: ${completion.completionPercentage.toFixed(1)}%\n`;
            message += `• Required: 80% course completion\n\n`;
            message += `**🚀 To earn your certificate:**\n`;
            message += `• Complete more lessons: \`/lesson <number>\`\n`;
            message += `• Mark them as done: \`/complete <lesson> ${courseKey}\`\n`;
            message += `• Track progress: \`/progress\`\n\n`;
            message += `You need ${Math.ceil((80 - completion.completionPercentage) * completion.totalModules / 100)} more lessons!`;
        } else {
            message += `📚 **Keep Learning!**\n\n`;
            message += `Your score: ${score}% (Need 70%+ for certificate)\n\n`;
            message += `**📖 Suggested Next Steps:**\n`;
            message += `• Review course material: \`/lesson <number>\`\n`;
            message += `• Practice with AI tools: \`/gpt\`, \`/translate\`\n`;
            message += `• Retake quiz when ready: \`/quiz ${courseKey}\`\n\n`;
            message += `**💡 Study Tips:**\n`;
            message += `• Focus on areas you found challenging\n`;
            message += `• Use practical exercises to reinforce learning\n`;
            message += `• Ask questions with \`/gpt\` about confusing topics`;
        }

        bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });

        // Log score submission
        await loggingService.logAction(user.id, 'quiz_score_submitted', {
            score,
            courseKey,
            certificateEligible: score >= 70 && completion.completed
        });

    } catch (error) {
        console.error("❌ Score command failed:", error);
        bot.sendMessage(chatId, "❌ Sorry, couldn't process your score. Please try again.");
    }
});

// COMMAND: /certificates
bot.onText(/\/certificates/, async (msg) => {
    const chatId = msg.chat.id;
    const telegramId = BigInt(msg.from.id);

    try {
        const user = await prisma.user.findUnique({ where: { telegramId } });
        if (!user) {
            return bot.sendMessage(chatId, "❌ You need to redeem an access code first. Use /redeem ET-XXXX-XXXX");
        }

        const certificates = await certificateService.getUserCertificates(user.id);

        if (certificates.length === 0) {
            return bot.sendMessage(chatId, `🎓 **Your Certificates**

You haven't earned any certificates yet! 

**How to Earn Certificates:**
1. **Enroll in a course:** \`/enroll fundamentals\`
2. **Complete at least 80% of lessons:** Use \`/lesson <number>\`
3. **Take the final quiz:** Use \`/quiz\` after completing lessons
4. **Pass with a good score:** 70% or higher typically required

**Available Courses:**
• AI Fundamentals (2 weeks)
• ChatGPT Mastery (3 weeks) 
• AI for Business (4 weeks)
• Digital Literacy (2 weeks)

Start your learning journey: \`/courses\` 🚀`, { parse_mode: 'Markdown' });
        }

        let message = `🎓 **Your Certificates**\n\n`;
        
        certificates.forEach((cert, index) => {
            const date = cert.issuedAt.toLocaleDateString('en-US', {
                year: 'numeric', month: 'short', day: 'numeric'
            });
            
            message += `**${index + 1}. ${cert.courseInfo.title}**\n`;
            message += `📅 Issued: ${date}\n`;
            message += `🏆 Score: ${cert.score}%\n`;
            message += `🆔 ID: \`${cert.certificateId}\`\n`;
            message += `✅ Verified: Yes\n\n`;
        });

        message += `**Certificate Verification:**\n`;
        message += `• Share your certificate ID with employers\n`;
        message += `• Anyone can verify at: afelu.com/verify/\n`;
        message += `• Use \`/verify <ID>\` to check certificate details\n\n`;
        message += `**Continue Learning:**\n`;
        message += `• Browse courses: \`/courses\`\n`;
        message += `• Check progress: \`/progress\``;

        bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });

    } catch (error) {
        console.error("❌ Certificates command failed:", error);
        bot.sendMessage(chatId, "❌ Sorry, couldn't retrieve your certificates. Please try again.");
    }
});

// COMMAND: /verify
bot.onText(/\/verify (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const certificateId = match[1].trim().toUpperCase();

    try {
        const validation = await certificateService.validateCertificate(certificateId);
        
        if (!validation.valid) {
            let message = `❌ **Certificate Verification Failed**\n\n`;
            if (validation.reason === 'not_found') {
                message += `Certificate ID \`${certificateId}\` was not found.\n\n`;
                message += `**Possible reasons:**\n`;
                message += `• The certificate ID was typed incorrectly\n`;
                message += `• The certificate has not been issued yet\n`;
                message += `• The certificate is from a different platform\n\n`;
            } else {
                message += `Unable to verify certificate at this time.\n\n`;
            }
            message += `**Format:** Certificate IDs look like \`AFC-2025-123456\`\n`;
            message += `**Help:** Contact support if you believe this is an error.`;
            
            return bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
        }

        const cert = validation.certificate;
        const date = cert.issuedAt.toLocaleDateString('en-US', {
            year: 'numeric', month: 'long', day: 'numeric'
        });

        const message = `✅ **Certificate Verified**\n\n` +
            `🎓 **Course:** ${cert.courseInfo.title}\n` +
            `📅 **Issued:** ${date}\n` +
            `🏆 **Score:** ${cert.score}%\n` +
            `🆔 **Certificate ID:** \`${cert.certificateId}\`\n` +
            `⏱️ **Duration:** ${cert.courseInfo.duration}\n\n` +
            `**About This Certificate:**\n` +
            `This certificate validates completion of comprehensive AI education designed for Ethiopian learners. The holder demonstrated practical understanding of AI tools, ethical usage, and real-world applications.\n\n` +
            `**Verification Details:**\n` +
            `• Issued by: Afelu Guardian AI Education\n` +
            `• Platform: Telegram Bot Learning System\n` +
            `• Status: Valid and Authentic\n\n` +
            `**Skills Demonstrated:**\n` +
            `• AI fundamentals and practical applications\n` +
            `• Hands-on experience with AI tools\n` +
            `• Ethical AI usage and digital literacy\n` +
            `• Problem-solving with AI assistance`;

        bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });

    } catch (error) {
        console.error("❌ Verify command failed:", error);
        bot.sendMessage(chatId, "❌ Sorry, couldn't verify the certificate. Please try again.");
    }
});

// Export the bot instance and control functions
module.exports = {
    bot,
    startBot,
    setupBotCommands,
    commands
};