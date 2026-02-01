"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const BOT_TOKEN = process.env.BOT_TOKEN;
if (!BOT_TOKEN) {
    throw new Error("BOT_TOKEN not found in .env");
}
const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;
let lastUpdateId = 0;
async function fetchUpdates() {
    try {
        const url = `${TELEGRAM_API}/getUpdates?offset=${lastUpdateId + 1}&timeout=30`;
        const res = await fetch(url);
        if (!res.ok) {
            console.error("HTTP error:", res.status);
            return;
        }
        const data = (await res.json());
        if (!data.ok)
            return;
        for (const update of data.result) {
            lastUpdateId = update.update_id;
            if (!update.message)
                continue;
            const { message } = update;
            const { chat, from, text } = message;
            if (!text)
                continue;
            console.log("---------------");
            console.log("Chat ID:", chat.id);
            console.log("Chat Type:", chat.type);
            console.log("Chat Title:", chat.title ?? "N/A");
            console.log("User:", from?.username ?? from?.first_name ?? "Unknown");
            console.log("Text:", text);
        }
    }
    catch (error) {
        console.error("Error fetching updates:", error);
    }
}
setInterval(fetchUpdates, 3000);
console.log("✅ Telegram bot polling started...");
