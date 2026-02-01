import { Schema, model, Document } from "mongoose";

export interface ISummary extends Document {
  telegramGroupId: number;

  periodStart: Date;
  periodEnd: Date;

  summaryText: string;

  createdAt: Date;
}

const SummarySchema = new Schema<ISummary>(
  {
    telegramGroupId: {
      type: Number,
      required: true,
      index: true
    },

    periodStart: {
      type: Date,
      required: true
    },

    periodEnd: {
      type: Date,
      required: true
    },

    summaryText: {
      type: String,
      required: true
    }
  },
  {
    timestamps: { createdAt: true, updatedAt: false }
  }
);

export const SummaryModel = model<ISummary>("Summary", SummarySchema);
