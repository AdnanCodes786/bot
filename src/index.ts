import dotenv from "dotenv";
dotenv.config();

import express from "express";
import { connectDB } from "./db/connect";
import { GroupModel } from "./models/group";
import { MessageModel } from "./models/mesage";
import summaryRouter from "./routes/summaryRoute";

const app = express();
const PORT = 3000;

app.use(express.json());

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Backend is running 🚀",
  });
});

app.use("/summary", summaryRouter);

app.post("/message", async (req, res) => {
  try {
    const update = req.body;

    if (!update || !update.message) {
      return res.sendStatus(200);
    }

    const message = update.message;

    if (!message.chat || !message.from) {
      return res.sendStatus(200);
    }

    const { chat, from, text } = message;

    if (chat.type !== "group" && chat.type !== "supergroup") {
      return res.sendStatus(200);
    }

    if (from.is_bot) {
      return res.sendStatus(200);
    }

    if (!text || typeof text !== "string") {
      return res.sendStatus(200);
    }

    if (text.startsWith("/")) {
      return res.sendStatus(200);
    }

    const telegramGroupId = chat.id;

    await GroupModel.findOneAndUpdate(
      { telegramGroupId },
      {
        telegramGroupId,
        title: chat.title,
        plan: "free",
        summaryRunsUsed: 0,
        summaryRunsLimit: 5,
      },
      { upsert: true }
    );

    await MessageModel.create({
      telegramGroupId,
      userId: from.id,
      username: from.username || from.first_name || "unknown",
      text: text.trim(),
    });

    return res.sendStatus(200);
  } catch (error) {
    console.error("Webhook error:", error);
    return res.sendStatus(200);
  }
});

async function start() {
  await connectDB();

  app.listen(PORT, () => {
    console.log("Backend is running now");
  });
}

start();
