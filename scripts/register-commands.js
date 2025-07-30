#!/usr/bin/env node
require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');

const token = process.env.TELEGRAM_BOT_TOKEN;

if (!token) {
    console.error('❌ TELEGRAM_BOT_TOKEN is required');
    process.exit(1);
}

const bot = new TelegramBot(token);

// Updated command list matching bot.js
const commands = [
    { command: 'start', description: '🛡️ Welcome message and getting started guide' },
    { command: 'help', description: '❓ Complete list of available commands' },
    { command: 'redeem', description: '🎟️ Redeem an access code (format: /redeem ET-XXXX-XXXX)' },
    { command: 'gpt', description: '🤖 Ask AI anything (1 credit)' },
    { command: 'image', description: '🎨 Generate AI images (3 credits)' },
    { command: 'fetch', description: '🌐 Access websites and get content (1 fetch credit)' },
    { command: 'translate', description: '🌍 Translate text to multiple languages (1 credit)' },
    { command: 'news', description: '📰 Get news summaries on any topic (1 credit)' },
    { command: 'summarize', description: '📋 Fetch and summarize web content (1 fetch + 1 GPT)' },
    { command: 'myquota', description: '📊 Check your remaining credits' }
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
