import { Schema, model, Document } from "mongoose";

export interface IMessage extends Document {
  telegramGroupId: number;
  userId: number;
  username: string;

  text: string;
  createdAt: Date;
}

const MessageSchema = new Schema<IMessage>(
  {
    telegramGroupId: {
      type: Number,
      required: true,
      index: true
    },

    userId: {
      type: Number,
      required: true
    },

    username: {
      type: String,
      required: true
    },

    text: {
      type: String,
      required: true
    }
  },
  {
    timestamps: { createdAt: true, updatedAt: false }
  }
);

export const MessageModel = model<IMessage>("Message", MessageSchema);
