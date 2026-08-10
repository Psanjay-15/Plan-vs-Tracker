import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";
import {
  confirmAssistantAction,
  deleteAssistantSession,
  getAssistantSession,
  listAssistantSessions,
  sendAssistantMessage,
} from "../services/assistant.service";
import type {
  AssistantMessage,
  ChatSession,
  PendingAssistantAction,
} from "../types/assistant";
import { getApiErrorMessage } from "../utils/getApiErrorMessage";
import { useAuth } from "../hooks/useAuth";

interface AssistantChatContextValue {
  sessions: ChatSession[];
  activeSessionId: string | null;
  messages: AssistantMessage[];
  pendingAction: PendingAssistantAction | null;
  isLoadingSessions: boolean;
  isLoadingMessages: boolean;
  isSending: boolean;
  error: string;
  startNewChat: () => void;
  selectSession: (sessionId: string) => Promise<void>;
  deleteSession: (sessionId: string) => Promise<void>;
  sendMessage: (text: string) => Promise<void>;
  confirmPendingAction: () => Promise<string | null>;
  cancelPendingAction: () => void;
  clearError: () => void;
  refreshSessions: () => Promise<void>;
}

const AssistantChatContext = createContext<AssistantChatContextValue | null>(
  null,
);

const upsertSession = (sessions: ChatSession[], session: ChatSession) => {
  const without = sessions.filter((item) => item.id !== session.id);
  return [session, ...without].sort(
    (first, second) =>
      new Date(second.lastMessageAt).getTime() -
      new Date(first.lastMessageAt).getTime(),
  );
};

export function AssistantChatProvider({ children }: PropsWithChildren) {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [pendingAction, setPendingAction] =
    useState<PendingAssistantAction | null>(null);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");

  const refreshSessions = useCallback(async () => {
    if (!user) {
      setSessions([]);
      return;
    }

    setIsLoadingSessions(true);
    try {
      const nextSessions = await listAssistantSessions();
      setSessions(nextSessions);
    } catch (requestError) {
      setError(
        getApiErrorMessage(requestError, "Unable to load chat history."),
      );
    } finally {
      setIsLoadingSessions(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      setSessions([]);
      setActiveSessionId(null);
      setMessages([]);
      setPendingAction(null);
      return;
    }

    void refreshSessions();
  }, [refreshSessions, user]);

  const startNewChat = useCallback(() => {
    setActiveSessionId(null);
    setMessages([]);
    setPendingAction(null);
    setError("");
  }, []);

  const selectSession = useCallback(async (sessionId: string) => {
    setIsLoadingMessages(true);
    setError("");
    setPendingAction(null);

    try {
      const result = await getAssistantSession(sessionId);
      setActiveSessionId(result.session.id);
      setMessages(result.messages);
      setSessions((current) => upsertSession(current, result.session));
    } catch (requestError) {
      setError(
        getApiErrorMessage(requestError, "Unable to open that chat."),
      );
    } finally {
      setIsLoadingMessages(false);
    }
  }, []);

  const deleteSession = useCallback(
    async (sessionId: string) => {
      try {
        await deleteAssistantSession(sessionId);
        setSessions((current) =>
          current.filter((session) => session.id !== sessionId),
        );
        if (activeSessionId === sessionId) {
          startNewChat();
        }
      } catch (requestError) {
        setError(
          getApiErrorMessage(requestError, "Unable to delete that chat."),
        );
      }
    },
    [activeSessionId, startNewChat],
  );

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isSending) return;

      const optimisticId = crypto.randomUUID();
      const optimisticMessage: AssistantMessage = {
        id: optimisticId,
        role: "user",
        content: trimmed,
      };

      setMessages((current) => [...current, optimisticMessage]);
      setPendingAction(null);
      setError("");
      setIsSending(true);

      try {
        const response = await sendAssistantMessage(trimmed, activeSessionId);
        setActiveSessionId(response.sessionId);
        setSessions((current) => upsertSession(current, response.session));
        setMessages((current) => [
          ...current.filter((message) => message.id !== optimisticId),
          response.userMessage,
          response.assistantMessage,
        ]);
        setPendingAction(response.pendingAction ?? null);
      } catch (requestError) {
        setMessages((current) =>
          current.filter((message) => message.id !== optimisticId),
        );
        setError(
          getApiErrorMessage(
            requestError,
            "The assistant could not complete that request.",
          ),
        );
      } finally {
        setIsSending(false);
      }
    },
    [activeSessionId, isSending],
  );

  const confirmPendingAction = useCallback(async () => {
    if (!pendingAction) return null;

    setIsSending(true);
    setError("");

    try {
      const response = await confirmAssistantAction(
        pendingAction.token,
        activeSessionId,
      );
      setPendingAction(null);
      if (response.assistantMessage) {
        setMessages((current) => [...current, response.assistantMessage!]);
      } else {
        setMessages((current) => [
          ...current,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            content: response.message,
          },
        ]);
      }
      return response.message;
    } catch (requestError) {
      setError(
        getApiErrorMessage(requestError, "The change could not be saved."),
      );
      return null;
    } finally {
      setIsSending(false);
    }
  }, [activeSessionId, pendingAction]);

  const cancelPendingAction = useCallback(() => {
    setPendingAction(null);
  }, []);

  const clearError = useCallback(() => setError(""), []);

  const value = useMemo(
    () => ({
      sessions,
      activeSessionId,
      messages,
      pendingAction,
      isLoadingSessions,
      isLoadingMessages,
      isSending,
      error,
      startNewChat,
      selectSession,
      deleteSession,
      sendMessage,
      confirmPendingAction,
      cancelPendingAction,
      clearError,
      refreshSessions,
    }),
    [
      sessions,
      activeSessionId,
      messages,
      pendingAction,
      isLoadingSessions,
      isLoadingMessages,
      isSending,
      error,
      startNewChat,
      selectSession,
      deleteSession,
      sendMessage,
      confirmPendingAction,
      cancelPendingAction,
      clearError,
      refreshSessions,
    ],
  );

  return (
    <AssistantChatContext.Provider value={value}>
      {children}
    </AssistantChatContext.Provider>
  );
}

export function useAssistantChat() {
  const context = useContext(AssistantChatContext);
  if (!context) {
    throw new Error("useAssistantChat must be used within AssistantChatProvider");
  }
  return context;
}
