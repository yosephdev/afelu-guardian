const app = require('./server');
const { startBot } = require('./bot');

const PORT = process.env.PORT || 3000;

// Start the Express server
app.listen(PORT, () => {
    console.log(`Afelu Guardian web server is running on http://localhost:${PORT}`);
});

// Start the Telegram bot with proper error handling
setTimeout(() => {
    startBot();
}, 2000); // Give the server time to start before starting the bot