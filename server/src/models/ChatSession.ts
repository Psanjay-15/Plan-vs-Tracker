import { model, Schema, Types } from "mongoose";

export interface IChatSession {
  userId: Types.ObjectId;
  title: string;
  lastMessageAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const chatSessionSchema = new Schema<IChatSession>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
      default: "New chat",
    },
    lastMessageAt: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },
  },
  { timestamps: true },
);

chatSessionSchema.index({ userId: 1, lastMessageAt: -1 });

const ChatSession = model<IChatSession>("ChatSession", chatSessionSchema);

export default ChatSession;
