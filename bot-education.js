require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const prisma = require('./prisma-education'); // Will need to create this with new schema
const openaiService = require('./services/openai');
const loggingService = require('./services/logging');

const token = process.env.TELEGRAM_BOT_TOKEN;

if (!token) {
    console.error('❌ TELEGRAM_BOT_TOKEN is required');
    process.exit(1);
// bot-education.js
// Telegram bot for AI education platform: handles course enrollment, progress, certificates, and AI practice (ChatGPT, Claude)
// Uses prisma-education client and OpenAI/Claude services
}

const bot = new TelegramBot(token, { polling: false });

// Education bot commands
const commands = [
    { command: 'start', description: '🛡️ Welcome to AI education platform' },
    { command: 'help', description: '❓ Complete list of available commands' },
    { command: 'courses', description: '📚 Browse available AI courses' },
    { command: 'enroll', description: '✏️ Enroll in a course' },
    { command: 'progress', description: '📊 Check your learning progress' },
    { command: 'continue', description: '▶️ Continue current course' },
    { command: 'certificate', description: '🏆 View earned certificates' },
    { command: 'chatgpt', description: '🤖 Practice with ChatGPT' },
    { command: 'claude', description: '🧠 Practice with Claude AI' },
    { command: 'resources', description: '📖 Additional learning resources' }
];

console.log("🎓 AI Education Bot started...");

// Function to register bot commands with Telegram
async function setupBotCommands() {
    try {
        await bot.setMyCommands(commands);
        console.log('✅ Bot commands registered successfully');
    } catch (error) {
        console.error('❌ Failed to register bot commands:', error);
    }
}

// Start command - Welcome to AI education
bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    const telegramId = msg.from.id;
    
    try {
        // Create or get student record
        const student = await prisma.student.upsert({
            where: { telegramId: BigInt(telegramId) },
            update: { updatedAt: new Date() },
            create: {
                telegramId: BigInt(telegramId),
                name: msg.from.first_name || 'Student',
                preferredLanguage: msg.from.language_code || 'en'
            }
        });

        const welcomeMessage = `
🎓 **Welcome to Afelu Guardian AI Education!**

I'm your AI learning assistant. Here's how I can help you master AI skills:

📚 **Available Courses:**
• Beginner: ChatGPT Fundamentals
• Intermediate: Advanced AI Applications  
• Advanced: AI for Business & Leadership

🎯 **Quick Start:**
• /courses - Browse all available courses
• /enroll - Join a course
• /chatgpt - Practice with ChatGPT
• /progress - Track your learning

🌟 **Supporting Digital Ethiopia 2025**
Learn AI skills to prepare for Ethiopia's digital future!

Type /help for all commands or /courses to begin learning!
        `;

        await bot.sendMessage(chatId, welcomeMessage, { parse_mode: 'Markdown' });
        
        await loggingService.logInteraction({
            studentId: student.id,
            interactionType: 'BOT_START',
            content: 'User started AI education bot'
        });

    } catch (error) {
        console.error('Error in /start command:', error);
        await bot.sendMessage(chatId, '❌ Sorry, there was an error. Please try again.');
    }
});

// Help command - Show all available commands
bot.onText(/\/help/, async (msg) => {
    const chatId = msg.chat.id;
    
    const helpMessage = `
🎓 **Afelu Guardian AI Education Commands**

**📚 Learning:**
/courses - Browse available AI courses
/enroll [course_id] - Enroll in a course
/progress - Check your learning progress
/continue - Continue current course
/certificate - View earned certificates

**🤖 AI Practice:**
/chatgpt [prompt] - Practice with ChatGPT
/claude [prompt] - Practice with Claude AI
/resources - Additional learning materials

**ℹ️ Support:**
/help - Show this help message
/start - Return to welcome screen

**🎯 Getting Started:**
1. Use /courses to see available courses
2. Use /enroll to join a course
3. Practice with /chatgpt and /claude
4. Track progress with /progress

Ready to master AI? Start with /courses! 🚀
    `;

    await bot.sendMessage(chatId, helpMessage, { parse_mode: 'Markdown' });
});

// Courses command - Show available courses
bot.onText(/\/courses/, async (msg) => {
    const chatId = msg.chat.id;
    
    try {
        const courses = await prisma.course.findMany({
            where: { isActive: true },
            orderBy: { level: 'asc' }
        });

        let coursesMessage = `📚 **Available AI Courses**\n\n`;
        
        courses.forEach(course => {
            const levelEmoji = course.level === 'BEGINNER' ? '🌱' : 
                              course.level === 'INTERMEDIATE' ? '🌿' : '🌳';
            
            coursesMessage += `${levelEmoji} **${course.title}**\n`;
            coursesMessage += `📝 ${course.description}\n`;
            coursesMessage += `⏱️ Duration: ${course.duration} hours\n`;
            coursesMessage += `📚 Modules: ${course.modules}\n`;
            coursesMessage += `🏷️ Level: ${course.level}\n`;
            coursesMessage += `📋 To enroll: /enroll ${course.id}\n\n`;
        });

        coursesMessage += `🎯 **Recommended Path:**\n`;
        coursesMessage += `1️⃣ Start with Beginner course\n`;
        coursesMessage += `2️⃣ Progress to Intermediate\n`;
        coursesMessage += `3️⃣ Complete Advanced for certification\n\n`;
        coursesMessage += `Ready to start? Use /enroll [course_id]`;

        await bot.sendMessage(chatId, coursesMessage, { parse_mode: 'Markdown' });

    } catch (error) {
        console.error('Error in /courses command:', error);
        await bot.sendMessage(chatId, '❌ Error loading courses. Please try again.');
    }
});

// Enroll command - Enroll in a course
bot.onText(/\/enroll(.*)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const telegramId = msg.from.id;
    const courseId = match[1] ? match[1].trim() : null;
    
    if (!courseId) {
        await bot.sendMessage(chatId, '❓ Please specify a course ID. Use /courses to see available courses.');
        return;
    }

    try {
        // Get student
        const student = await prisma.student.findUnique({
            where: { telegramId: BigInt(telegramId) }
        });

        if (!student) {
            await bot.sendMessage(chatId, '❌ Please use /start first to create your profile.');
            return;
        }

        // Check if course exists
        const course = await prisma.course.findUnique({
            where: { id: courseId }
        });

        if (!course) {
            await bot.sendMessage(chatId, '❌ Course not found. Use /courses to see available courses.');
            return;
        }

        // Check if already enrolled
        const existingEnrollment = await prisma.enrollment.findUnique({
            where: {
                studentId_courseId: {
                    studentId: student.id,
                    courseId: courseId
                }
            }
        });

        if (existingEnrollment) {
            await bot.sendMessage(chatId, '✅ You are already enrolled in this course! Use /continue to resume learning.');
            return;
        }

        // Create enrollment
        await prisma.enrollment.create({
            data: {
                studentId: student.id,
                courseId: courseId
            }
        });

        // Create progress tracking
        const lessons = await prisma.lesson.findMany({
            where: { courseId: courseId },
            orderBy: { order: 'asc' }
        });

        await prisma.courseProgress.create({
            data: {
                studentId: student.id,
                courseId: courseId,
                totalLessons: lessons.length,
                lessonsCompleted: 0,
                progressPercent: 0
            }
        });

        const enrollmentMessage = `
🎉 **Successfully Enrolled!**

📚 Course: ${course.title}
📝 Description: ${course.description}
⏱️ Duration: ${course.duration} hours
📚 Lessons: ${lessons.length}

🎯 **Next Steps:**
• Use /continue to start learning
• Use /progress to track your advancement
• Practice with /chatgpt and /claude

Ready to begin? Type /continue to start your first lesson! 🚀
        `;

        await bot.sendMessage(chatId, enrollmentMessage, { parse_mode: 'Markdown' });

        await loggingService.logInteraction({
            studentId: student.id,
            interactionType: 'COURSE_ENROLLMENT',
            content: `Enrolled in course: ${course.title}`,
            metadata: { courseId: courseId }
        });

    } catch (error) {
        console.error('Error in /enroll command:', error);
        await bot.sendMessage(chatId, '❌ Error enrolling in course. Please try again.');
    }
});

// Progress command - Check learning progress
bot.onText(/\/progress/, async (msg) => {
    const chatId = msg.chat.id;
    const telegramId = msg.from.id;
    
    try {
        const student = await prisma.student.findUnique({
            where: { telegramId: BigInt(telegramId) },
            include: {
                progress: {
                    include: { course: true }
                },
                certificates: {
                    include: { course: true }
                }
            }
        });

        if (!student) {
            await bot.sendMessage(chatId, '❌ Please use /start first to create your profile.');
            return;
        }

        let progressMessage = `📊 **Your Learning Progress**\n\n`;

        if (student.progress.length === 0) {
            progressMessage += `No courses in progress. Use /courses to explore available courses!`;
        } else {
            student.progress.forEach(progress => {
                const percentage = progress.progressPercent;
                const progressBar = '█'.repeat(Math.floor(percentage/10)) + '░'.repeat(10 - Math.floor(percentage/10));
                
                progressMessage += `📚 **${progress.course.title}**\n`;
                progressMessage += `${progressBar} ${percentage}%\n`;
                progressMessage += `📝 Completed: ${progress.lessonsCompleted}/${progress.totalLessons} lessons\n\n`;
            });
        }

        if (student.certificates.length > 0) {
            progressMessage += `🏆 **Certificates Earned:**\n`;
            student.certificates.forEach(cert => {
                progressMessage += `✅ ${cert.course.title} - ${cert.issuedAt.toDateString()}\n`;
            });
        }

        progressMessage += `\n🎯 Use /continue to resume learning or /courses to explore more!`;

        await bot.sendMessage(chatId, progressMessage, { parse_mode: 'Markdown' });

    } catch (error) {
        console.error('Error in /progress command:', error);
        await bot.sendMessage(chatId, '❌ Error loading progress. Please try again.');
    }
});

// ChatGPT practice command
bot.onText(/\/chatgpt(.*)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const telegramId = msg.from.id;
    const prompt = match[1] ? match[1].trim() : null;
    
    if (!prompt) {
        await bot.sendMessage(chatId, '❓ Please provide a prompt. Example: /chatgpt What is artificial intelligence?');
        return;
    }

    try {
        const student = await prisma.student.findUnique({
            where: { telegramId: BigInt(telegramId) }
        });

        if (!student) {
            await bot.sendMessage(chatId, '❌ Please use /start first to create your profile.');
            return;
        }

        await bot.sendMessage(chatId, '🤖 Processing your ChatGPT request...');

        // Get AI response
        const response = await openaiService.getCompletion(prompt);

        const aiResponse = `
🤖 **ChatGPT Response:**

${response}

💡 **Learning Tip:** Notice how I structured this response. Good AI prompts are clear and specific!

🎯 **Next:** Try asking follow-up questions or use /claude to compare responses!
        `;

        await bot.sendMessage(chatId, aiResponse, { parse_mode: 'Markdown' });

        // Log interaction
        await loggingService.logInteraction({
            studentId: student.id,
            interactionType: 'CHATGPT_PRACTICE',
            content: prompt,
            response: response
        });

    } catch (error) {
        console.error('Error in /chatgpt command:', error);
        await bot.sendMessage(chatId, '❌ Error processing ChatGPT request. Please try again.');
    }
});

// Error handling
bot.on('polling_error', (error) => {
    console.error('❌ Polling error:', error);
});

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down bot gracefully...');
    await bot.stopPolling();
    await prisma.$disconnect();
    process.exit(0);
});

// Export bot and setup function
module.exports = { bot, setupBotCommands };

// Auto-setup if run directly
if (require.main === module) {
    setupBotCommands();
}
