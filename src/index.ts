import dotenv from "dotenv";
dotenv.config();

import express from "express";
import { connectDB } from "./db/connect";
import { GroupModel } from "./models/group";
import { MessageModel } from "./models/mesage";
connectDB();
const app = express();
const PORT = 3000;

app.use(express.json());

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Backend is running 🚀",
  });
});

app.post("/message", async (req, res) => {
  const update = req.body;
  if (update.message) {
    return res.status(400).json({
      success: false,
      message: "no message content found",
    });
  }
  const message = update.message;
  const { chat, from, text } = message;

  if (!chat || (chat.type !== "group" && chat.type !== "supergroup")) {
    return res.sendStatus(200);
  }

  if (!from.is_bot) {
    return res.sendStatus(200);
  }
  if (text.startsWith("/")) {
    return res.sendStatus(200);
  }

  const telegramGroupId=chat.id;

  await GroupModel.findOneAndUpdate(
      { telegramGroupId },
      {
        telegramGroupId,
        title: chat.title,
        plan: "free",
        summaryRunsUsed: 0,
        summaryRunsLimit: 5,
      },
      { upsert: true, new: true }
    );

    await MessageModel.create({
      telegramGroupId,
      userId: from.id,
      username: from.username || from.first_name || "unknown",
      text: text.trim(),
    });

  res.status(200).json({
    success: true,
    // data: req.body,
    message: "Route for receiving telegram message",
  });
});

async function start() {
  app.listen(PORT, () => {
    console.log("Backend is running now");
  });
}

start();
