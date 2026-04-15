require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');

const token = process.env.TELEGRAM_TOKEN;
const chatId = process.env.CHAT_ID;

// We set polling to false because we just want to send one message and exit
const bot = new TelegramBot(token, {polling: false});

console.log("Attempting to send a message to Telegram...");

bot.sendMessage(chatId, "🚀 Connection successful! Your Termux bot is securely linked.")
    .then(() => {
        console.log("✅ Success! Check your Telegram app.");
        process.exit(0);
    })
    .catch((error) => {
        console.error("❌ Error sending message:", error.message);
        process.exit(1);
    });

