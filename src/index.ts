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
  const response = await axios.post(
    `https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendMessage`,
    {
      chat_id: chatId,
      text,
    },
  );
  console.log(JSON.stringify(response) + " respnose");
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
  console.log("[webhook] HIT /message");

  try {
    const update = req.body;

    console.log("[webhook] raw update received");

    if (!update?.message) {
      console.log("[webhook] no message object, ignoring");
      return res.sendStatus(200);
    }

    const { chat, from, text } = update.message;

    if (!chat || !from) {
      console.log("[webhook] missing chat or from");
      return res.sendStatus(200);
    }

    if (from.is_bot) {
      console.log("[webhook] message from bot, ignoring");
      return res.sendStatus(200);
    }

    if (!text) {
      console.log("[webhook] non-text message, ignoring");
      return res.sendStatus(200);
    }

    console.log("[webhook] message received:", {
      chatId: chat.id,
      text,
    });


    if (text.trim().startsWith("/summary")) {
      console.log("[/summary] command received:", text);

      const raw = text.replace("/summary", "").trim();

      if (!raw) {
        console.log("[/summary] missing date argument");
        await sendTelegramMessage(
          chat.id,
          "Usage:\n/summary 24th Feb 2026"
        );
        return res.sendStatus(200);
      }

      const match = raw.match(
        /^(\d{1,2})(st|nd|rd|th)\s+([A-Za-z]+)\s+(\d{4})$/i
      );

      if (!match) {
        console.log("[/summary] invalid format:", raw);
        await sendTelegramMessage(
          chat.id,
          "Invalid format.\nUse: /summary 24th Feb 2026"
        );
        return res.sendStatus(200);
      }

      const day = parseInt(match[1], 10);
      const monthName = match[3].toLowerCase();
      const year = parseInt(match[4], 10);

      console.log("[/summary] parsed date:", {
        day,
        monthName,
        year,
      });

      const monthMap: Record<string, number> = {
        jan: 0, january: 0,
        feb: 1, february: 1,
        mar: 2, march: 2,
        apr: 3, april: 3,
        may: 4,
        jun: 5, june: 5,
        jul: 6, july: 6,
        aug: 7, august: 7,
        sep: 8, sept: 8, september: 8,
        oct: 9, october: 9,
        nov: 10, november: 10,
        dec: 11, december: 11,
      };

      const month = monthMap[monthName];

      if (month === undefined) {
        console.log("[/summary] invalid month:", monthName);
        await sendTelegramMessage(
          chat.id,
          "Invalid month name.\nExample: Feb, February"
        );
        return res.sendStatus(200);
      }

      const date = new Date(year, month, day);

      if (isNaN(date.getTime())) {
        console.log("[/summary] invalid date object");
        await sendTelegramMessage(chat.id, "Invalid date provided.");
        return res.sendStatus(200);
      }

      const periodStart = new Date(date);
      periodStart.setHours(0, 0, 0, 0);

      const periodEnd = new Date(date);
      periodEnd.setHours(23, 59, 59, 999);

      console.log(
        "[/summary] period window:",
        periodStart.toISOString(),
        "→",
        periodEnd.toISOString()
      );

      try {
        console.log("[/summary] generating summary for group:", chat.id);

        const result = await generateOrFetchSummary({
          telegramGroupId: chat.id,
          periodStart,
          periodEnd,
        });

        console.log(
          "[/summary] summary generated, cache:",
          result.fromCache
        );

        await sendTelegramMessage(chat.id, result.summary);
      } catch (err: any) {
        console.error("[/summary] failed:", err.message);
        await sendTelegramMessage(chat.id, err.message);
      }

      return res.sendStatus(200);
    }

    /* ===================== OTHER COMMANDS ===================== */

    if (text.startsWith("/")) {
      console.log("[webhook] other command ignored:", text);
      return res.sendStatus(200);
    }

    /* ===================== NORMAL MESSAGE STORAGE ===================== */

    console.log("[message] storing message for group:", chat.id);

    await GroupModel.findOneAndUpdate(
      { telegramGroupId: chat.id },
      {
        telegramGroupId: chat.id,
        title: chat.title,
        plan: "free",
        summaryRunsLimit: 5,
      },
      { upsert: true }
    );

    await MessageModel.create({
      telegramGroupId: chat.id,
      userId: from.id,
      username: from.username || from.first_name || "unknown",
      text: text.trim(),
    });

    console.log("[message] message stored successfully");

    return res.sendStatus(200);
  } catch (error) {
    console.error("[webhook] unexpected error:", error);
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
