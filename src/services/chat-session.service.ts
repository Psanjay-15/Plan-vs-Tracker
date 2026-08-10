import { Types } from "mongoose";
import ChatMessage from "../models/ChatMessage";
import ChatSession from "../models/ChatSession";
import type { AssistantChart } from "../utils/assistantCharts";
import type { AssistantHistoryMessage } from "./assistant.service";

const HISTORY_LIMIT = 20;

export const sessionResponse = (session: {
  _id: unknown;
  title: string;
  lastMessageAt: Date;
  createdAt: Date;
  updatedAt: Date;
}) => ({
  id: String(session._id),
  title: session.title,
  lastMessageAt: session.lastMessageAt,
  createdAt: session.createdAt,
  updatedAt: session.updatedAt,
});

export const messageResponse = (message: {
  _id: unknown;
  role: "user" | "assistant";
  content: string;
  charts?: AssistantChart[];
  createdAt: Date;
}) => ({
  id: String(message._id),
  role: message.role,
  content: message.content,
  ...(message.charts && message.charts.length > 0
    ? { charts: message.charts }
    : {}),
  createdAt: message.createdAt,
});

export const titleFromMessage = (message: string) => {
  const cleaned = message.replace(/\s+/g, " ").trim();
  if (!cleaned) return "New chat";
  return cleaned.length <= 60 ? cleaned : `${cleaned.slice(0, 57)}...`;
};

export const createChatSession = async (userId: string, title = "New chat") => {
  return ChatSession.create({
    userId,
    title,
    lastMessageAt: new Date(),
  });
};

export const listChatSessions = async (userId: string) => {
  return ChatSession.find({ userId })
    .sort({ lastMessageAt: -1 })
    .limit(50)
    .lean();
};

export const getOwnedSession = async (userId: string, sessionId: string) => {
  if (!Types.ObjectId.isValid(sessionId)) return null;
  return ChatSession.findOne({ _id: sessionId, userId });
};

export const listSessionMessages = async (sessionId: string) => {
  return ChatMessage.find({ sessionId }).sort({ createdAt: 1 }).lean();
};

export const getRecentHistory = async (
  sessionId: string,
): Promise<AssistantHistoryMessage[]> => {
  const messages = await ChatMessage.find({ sessionId })
    .sort({ createdAt: -1 })
    .limit(HISTORY_LIMIT)
    .select("role content")
    .lean();

  return messages.reverse().map((message) => ({
    role: message.role,
    content: message.content,
  }));
};

export const appendChatMessage = async (input: {
  sessionId: string;
  userId: string;
  role: "user" | "assistant";
  content: string;
  charts?: AssistantChart[];
}) => {
  const message = await ChatMessage.create({
    sessionId: input.sessionId,
    userId: input.userId,
    role: input.role,
    content: input.content,
    ...(input.charts && input.charts.length > 0
      ? { charts: input.charts }
      : {}),
  });

  await ChatSession.updateOne(
    { _id: input.sessionId, userId: input.userId },
    { $set: { lastMessageAt: message.createdAt } },
  );

  return message;
};

export const deleteChatSession = async (userId: string, sessionId: string) => {
  const session = await getOwnedSession(userId, sessionId);
  if (!session) return false;

  await Promise.all([
    ChatMessage.deleteMany({ sessionId: session._id, userId }),
    session.deleteOne(),
  ]);

  return true;
};
