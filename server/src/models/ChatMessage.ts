import { model, Schema, Types } from "mongoose";
import type { AssistantChart } from "../utils/assistantCharts";

export interface IChatMessage {
  sessionId: Types.ObjectId;
  userId: Types.ObjectId;
  role: "user" | "assistant";
  content: string;
  charts?: AssistantChart[];
  createdAt: Date;
  updatedAt: Date;
}

const chatMessageSchema = new Schema<IChatMessage>(
  {
    sessionId: {
      type: Schema.Types.ObjectId,
      ref: "ChatSession",
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    role: {
      type: String,
      enum: ["user", "assistant"],
      required: true,
    },
    content: {
      type: String,
      required: true,
      maxlength: 8000,
    },
    charts: {
      type: [Schema.Types.Mixed],
      default: undefined,
    },
  },
  { timestamps: true },
);

chatMessageSchema.index({ sessionId: 1, createdAt: 1 });

const ChatMessage = model<IChatMessage>("ChatMessage", chatMessageSchema);

export default ChatMessage;
