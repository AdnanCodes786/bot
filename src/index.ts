import dotenv from "dotenv";
dotenv.config();

import express from "express";
import { connectDB } from "./db/connect";
import { GroupModel } from "./models/group";
import { MessageModel } from "./models/mesage";
import summaryRouter from "./routes/summaryRoute";
import { generateOrFetchSummary } from "./services/summary.service";
import axios from "axios";

const app = express();
const PORT = 3000;

async function sendTelegramMessage(chatId: number, text: string) {
  await axios.post(
    `https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendMessage`,
    {
      chat_id: chatId,
      text,
    },
  );
}

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

    if (text.startsWith("/summary")) {
      const parts = text.trim().split(/\s+/);

      if (parts.length !== 2) {
        await sendTelegramMessage(chat.id, "Usage:\n/summary YYYY-MM-DD");
        return res.sendStatus(200);
      }

      const dateStr = parts[1];
      const date = new Date(dateStr);

      if (isNaN(date.getTime())) {
        await sendTelegramMessage(
          chat.id,
          "Invalid date format. Use YYYY-MM-DD",
        );
        return res.sendStatus(200);
      }

      const periodStart = new Date(date);
      periodStart.setHours(0, 0, 0, 0);

      const periodEnd = new Date(date);
      periodEnd.setHours(23, 59, 59, 999);

      try {
        const result = await generateOrFetchSummary({
          telegramGroupId: chat.id,
          periodStart,
          periodEnd,
        });

        await sendTelegramMessage(chat.id, result.summary);
      } catch (err: any) {
        await sendTelegramMessage(chat.id, err.message);
      }

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
      { upsert: true },
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
