import { api } from "./api";
import type {
  AssistantChatResponse,
  AssistantMessage,
  ChatSession,
} from "../types/assistant";

export const listAssistantSessions = async () => {
  const response = await api.get<{ success: boolean; sessions: ChatSession[] }>(
    "/assistant/sessions",
  );
  return response.data.sessions;
};

export const createAssistantSession = async () => {
  const response = await api.post<{ success: boolean; session: ChatSession }>(
    "/assistant/sessions",
  );
  return response.data.session;
};

export const getAssistantSession = async (sessionId: string) => {
  const response = await api.get<{
    success: boolean;
    session: ChatSession;
    messages: AssistantMessage[];
  }>(`/assistant/sessions/${sessionId}`);
  return response.data;
};

export const deleteAssistantSession = async (sessionId: string) => {
  await api.delete(`/assistant/sessions/${sessionId}`);
};

export const sendAssistantMessage = async (
  message: string,
  sessionId?: string | null,
) => {
  const response = await api.post<AssistantChatResponse>("/assistant/chat", {
    message,
    ...(sessionId ? { sessionId } : {}),
  });
  return response.data;
};

export const confirmAssistantAction = async (
  token: string,
  sessionId?: string | null,
) => {
  const response = await api.post<{
    success: boolean;
    message: string;
    sessionId?: string;
    assistantMessage?: AssistantMessage;
  }>("/assistant/actions/confirm", {
    token,
    ...(sessionId ? { sessionId } : {}),
  });
  return response.data;
};
