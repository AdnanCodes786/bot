import { GoogleGenAI } from "@google/genai";
import { GroupModel } from "../models/group";
import { MessageModel } from "../models/mesage";
import { SummaryModel } from "../models/summary";

const ai = new GoogleGenAI({});

const MIN_MESSAGES = 1;
const MAX_MESSAGE_LENGTH = 1000;
const MAX_TOTAL_CHARS = 12000;

export async function generateOrFetchSummary({
  telegramGroupId,
  periodStart,
  periodEnd,
}: {
  telegramGroupId: number;
  periodStart: Date;
  periodEnd: Date;
}) {
  const existingSummary = await SummaryModel.findOne({
    telegramGroupId,
    periodStart,
    periodEnd,
  });

  if (existingSummary) {
    return {
      fromCache: true,
      summary: existingSummary.summaryText,
    };
  }

  const messages = await MessageModel.find({
    telegramGroupId,
    createdAt: {
      $gte: periodStart,
      $lte: periodEnd,
    },
  }).sort({ createdAt: 1 });

  if (!messages || messages.length === 0) {
    throw new Error("No messages found for this period");
  }

  if (messages.length < MIN_MESSAGES) {
    throw new Error("Not enough messages to generate summary");
  }

  const group = await GroupModel.findOne({ telegramGroupId });

  if (!group) {
    throw new Error("Group not found");
  }

  if (
    group.plan === "free" &&
    group.summaryRunsUsed >= group.summaryRunsLimit
  ) {
    throw new Error("Free summary limit reached");
  }

  let totalChars = 0;
  const cleanedMessages: string[] = [];

  for (const msg of messages) {
    let text = msg.text;

    if (text.length > MAX_MESSAGE_LENGTH) {
      text = text.slice(0, MAX_MESSAGE_LENGTH);
    }

    if (totalChars + text.length > MAX_TOTAL_CHARS) {
      break;
    }

    cleanedMessages.push(`${msg.username || "user"}: ${text}`);
    totalChars += text.length;
  }

  const prompt = `
You are an assistant that summarizes Telegram group conversations in a time-based manner.

Produce a concise, structured summary focusing on:
- key topics discussed
- decisions made
- important updates
- action items

Ignore greetings, emojis, trivial chatter, and repetition.
Do NOT list messages or users individually.

Messages:
${cleanedMessages.join("\n")}
`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });

    const summaryText = response.text?.trim();

    if (!summaryText) {
      throw new Error("Failed to generate summary");
    }

    await SummaryModel.create({
      telegramGroupId,
      periodStart,
      periodEnd,
      summaryText,
    });

    group.summaryRunsUsed += 1;
    await group.save();

    return {
      fromCache: false,
      summary: summaryText,
    };
  } catch (error: any) {
    throw new Error(`AI generation failed: ${error.message}`);
  }
}
