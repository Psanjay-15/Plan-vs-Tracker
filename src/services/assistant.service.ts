import { api } from "./api";
import type { AssistantChatResponse, AssistantMessage } from "../types/assistant";

export const sendAssistantMessage = async (
  message: string,
  history: AssistantMessage[],
) => {
  const response = await api.post<AssistantChatResponse>("/assistant/chat", {
    message,
    history: history.map(({ role, content }) => ({ role, content })),
  });
  return response.data;
};

export const confirmAssistantAction = async (token: string) => {
  const response = await api.post<{ success: boolean; message: string }>(
    "/assistant/actions/confirm",
    { token },
  );
  return response.data;
};
