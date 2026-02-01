import { Schema, model, Document } from "mongoose";

export interface IGroup extends Document {
  telegramGroupId: number;
  title: string;
  plan: "free" | "paid";
  summaryRunsUsed: number;
  summaryRunsLimit: number;
  dailySummaryEnabled: boolean;
  subscriptionExpiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const GroupSchema = new Schema<IGroup>(
  {
    telegramGroupId: { type: Number, required: true, unique: true },
    title: { type: String, required: true },
    plan: { type: String, enum: ["free", "paid"], default: "free" },
    summaryRunsUsed: { type: Number, default: 0 },
    summaryRunsLimit: { type: Number, default: 5 },
    dailySummaryEnabled: { type: Boolean, default: false },
    subscriptionExpiresAt: { type: Date, default: null }
  },
  { timestamps: true }
);

export const GroupModel = model<IGroup>("Group", GroupSchema);
