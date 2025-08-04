const app = require('./server');
const { startBot } = require('./bot');

// Fix: Use Railway's PORT and listen on all interfaces
const PORT = process.env.PORT || 3000;

// Change from localhost to 0.0.0.0 for Railway
app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Afelu Guardian web server is running on http://0.0.0.0:${PORT}`);
});

// Start the Telegram bot with proper error handling
setTimeout(() => {
    startBot();
}, 2000); // Give the server time to start before starting the bot