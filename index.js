const app = require('./server'); // We'll create server.js next
const bot = require('./bot');

const PORT = process.env.PORT || 3000;

// Start the Express server
app.listen(PORT, () => {
    console.log(`Afelu Guardian web server is running on http://localhost:${PORT}`);
});

// Start the Telegram bot's polling
bot.startPolling();