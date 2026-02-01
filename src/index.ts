import dotenv from "dotenv";
import { connectDB } from "./db/connect";
import { registerWebhook } from "./utils/webhook-setup";
dotenv.config();


async function start(): Promise<void> {
  await registerWebhook("https://keen-sparrow-79.webhook.cool");
  await connectDB();
}

start();
