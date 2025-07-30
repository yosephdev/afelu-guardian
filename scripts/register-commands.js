#!/usr/bin/env node
require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');

const token = process.env.TELEGRAM_BOT_TOKEN;

if (!token) {
    console.error('❌ TELEGRAM_BOT_TOKEN is required');
    process.exit(1);
}

const bot = new TelegramBot(token);

// Updated command list for AI Education Platform
const commands = [
    { command: 'start', description: '🛡️ Welcome to AI education platform' },
    { command: 'help', description: '❓ Complete list of available commands' },
    { command: 'courses', description: '📚 Browse available AI courses' },
    { command: 'enroll', description: '✏️ Enroll in a course' },
    { command: 'progress', description: '📊 Check your learning progress' },
    { command: 'continue', description: '▶️ Continue current course' },
    { command: 'certificate', description: '� View earned certificates' },
    { command: 'chatgpt', description: '🤖 Practice with ChatGPT' },
    { command: 'claude', description: '🧠 Practice with Claude AI' },
    { command: 'resources', description: '� Additional learning resources' }
];

async function registerCommands() {
    try {
        console.log('🔄 Registering bot commands with Telegram...');
        await bot.setMyCommands(commands);
        console.log('✅ Successfully registered these commands:');
        commands.forEach(cmd => {
            console.log(`   /${cmd.command} - ${cmd.description}`);
        });
        console.log('\n🎉 Bot commands are now synced with Telegram!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Failed to register commands:', error.message);
        process.exit(1);
    }
}

registerCommands();
