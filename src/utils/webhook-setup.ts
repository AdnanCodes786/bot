import dotenv from "dotenv";
import axios from "axios";

dotenv.config();

const BOT_TOKEN = process.env.BOT_TOKEN;
const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;


export async function registerWebhook(url: String): Promise<void> {
    try {
        const config = {
            method: "POST",
            headers: {
                "content-type": "application/json"
            },
            data: {
                "url": url
            },
            url: `${TELEGRAM_API}/setWebhook`
        }
        const response = await axios(config);
        console.log(JSON.stringify(response.data));

    } catch (error: any) {
        console.log(error);

    }
}



