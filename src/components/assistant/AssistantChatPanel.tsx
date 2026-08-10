import { type FormEvent, Fragment, useEffect, useRef, useState } from "react";
import styled from "styled-components";
import { AssistantMarkdown } from "./AssistantMarkdown";
import { AppIcon } from "../common/AppIcon";
import { Button } from "../common/Button";
import { confirmAssistantAction, sendAssistantMessage } from "../../services/assistant.service";
import type { AssistantMessage, PendingAssistantAction } from "../../types/assistant";
import { getApiErrorMessage } from "../../utils/getApiErrorMessage";

const Shell = styled.section<{ $compact?: boolean }>`
  display: grid;
  height: ${({ $compact }) => ($compact ? "100%" : "min(720px, calc(100vh - 190px))")};
  min-height: ${({ $compact }) => ($compact ? "0" : "520px")};
  grid-template-rows: minmax(0, 1fr) auto;
  overflow: hidden;
  border: ${({ $compact }) => ($compact ? "0" : "1px solid var(--color-border)")};
  border-radius: ${({ $compact }) => ($compact ? "0" : "var(--radius-xl)")};
  background: var(--color-surface);
  box-shadow: ${({ $compact }) => ($compact ? "none" : "var(--shadow-sm)")};
`;

const Conversation = styled.div`
  display: flex;
  min-height: 0;
  flex-direction: column;
  gap: var(--space-4);
  overflow-y: auto;
  padding: var(--space-5);
`;

const Empty = styled.div`
  display: grid;
  max-width: 560px;
  margin: auto;
  place-items: center;
  text-align: center;
  color: var(--color-text-muted);

  h2 {
    margin: var(--space-3) 0 var(--space-2);
    color: var(--color-text);
    font-size: var(--font-size-lg);
  }

  p {
    margin-bottom: var(--space-4);
    font-size: var(--font-size-sm);
  }
`;

const AssistantMark = styled.div`
  display: grid;
  width: 2.75rem;
  height: 2.75rem;
  place-items: center;
  border-radius: var(--radius-lg);
  background: var(--color-primary-100);
  color: var(--color-primary-700);
`;

const Suggestions = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: var(--space-2);
`;

const Suggestion = styled.button`
  padding: 0.55rem 0.8rem;
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-full);
  background: var(--color-surface);
  color: var(--color-text);
  font-size: var(--font-size-sm);
  cursor: pointer;

  &:hover {
    border-color: var(--color-primary-500);
    background: var(--color-primary-50);
  }
`;

const MessageRow = styled.div<{ $role: "user" | "assistant" }>`
  display: flex;
  justify-content: ${({ $role }) => ($role === "user" ? "flex-end" : "flex-start")};
`;

const Bubble = styled.div<{ $role: "user" | "assistant" }>`
  max-width: min(88%, 520px);
  padding: 0.75rem 0.9rem;
  border: 1px solid
    ${({ $role }) =>
      $role === "user" ? "var(--color-primary-600)" : "var(--color-border)"};
  border-radius: ${({ $role }) =>
    $role === "user"
      ? "var(--radius-lg) var(--radius-sm) var(--radius-lg) var(--radius-lg)"
      : "var(--radius-sm) var(--radius-lg) var(--radius-lg) var(--radius-lg)"};
  background: ${({ $role }) =>
    $role === "user" ? "var(--color-primary-600)" : "var(--color-surface-subtle)"};
  color: ${({ $role }) => ($role === "user" ? "#fff" : "var(--color-text)")};
  white-space: ${({ $role }) => ($role === "user" ? "pre-wrap" : "normal")};
  font-size: var(--font-size-sm);
`;

const ActionCard = styled.div`
  width: min(100%, 480px);
  padding: var(--space-4);
  border: 1px solid var(--color-primary-500);
  border-radius: var(--radius-lg);
  background: var(--color-primary-50);

  h3 {
    margin-bottom: var(--space-2);
    font-size: var(--font-size-md);
  }

  p {
    margin-bottom: var(--space-3);
    color: var(--color-text-muted);
    font-size: var(--font-size-sm);
  }
`;

const ActionDetails = styled.dl`
  display: grid;
  grid-template-columns: auto 1fr;
  gap: var(--space-2) var(--space-4);
  margin: 0 0 var(--space-4);

  dt {
    color: var(--color-text-muted);
  }

  dd {
    margin: 0;
    font-weight: 650;
  }
`;

const Actions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
`;

const Composer = styled.form`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: var(--space-3);
  padding: var(--space-4);
  border-top: 1px solid var(--color-border);
  background: var(--color-surface-subtle);
`;

const Input = styled.textarea`
  width: 100%;
  min-height: 2.8rem;
  max-height: 8rem;
  resize: none;
  padding: 0.72rem 0.9rem;
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-md);
  outline: none;
  background: var(--color-surface);
  color: var(--color-text);

  &:focus {
    border-color: var(--color-primary-500);
    box-shadow: var(--focus-ring);
  }
`;

const ErrorText = styled.p`
  grid-column: 1 / -1;
  margin: 0;
  color: var(--color-danger-600);
  font-size: var(--font-size-sm);
`;

const makeMessage = (
  role: AssistantMessage["role"],
  content: string,
): AssistantMessage => ({
  id: crypto.randomUUID(),
  role,
  content,
});

interface AssistantChatPanelProps {
  suggestions: string[];
  compact?: boolean;
  messages: AssistantMessage[];
  onMessagesChange: (messages: AssistantMessage[]) => void;
  pendingAction: PendingAssistantAction | null;
  onPendingActionChange: (action: PendingAssistantAction | null) => void;
}

export function AssistantChatPanel({
  suggestions,
  compact = false,
  messages,
  onMessagesChange,
  pendingAction,
  onPendingActionChange,
}: AssistantChatPanelProps) {
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");
  const conversationRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () =>
    requestAnimationFrame(() => {
      conversationRef.current?.scrollTo({
        top: conversationRef.current.scrollHeight,
        behavior: "smooth",
      });
    });

  useEffect(() => {
    scrollToBottom();
  }, [messages, pendingAction, isSending]);

  const submit = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isSending) return;

    const userMessage = makeMessage("user", trimmed);
    const history = messages;
    onMessagesChange([...messages, userMessage]);
    setInput("");
    setError("");
    onPendingActionChange(null);
    setIsSending(true);

    try {
      const response = await sendAssistantMessage(trimmed, history);
      onMessagesChange([
        ...history,
        userMessage,
        makeMessage("assistant", response.message),
      ]);
      onPendingActionChange(response.pendingAction ?? null);
    } catch (requestError) {
      setError(
        getApiErrorMessage(
          requestError,
          "The assistant could not complete that request.",
        ),
      );
    } finally {
      setIsSending(false);
    }
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    void submit(input);
  };

  const confirm = async () => {
    if (!pendingAction) return;

    setIsSending(true);
    setError("");

    try {
      const response = await confirmAssistantAction(pendingAction.token);
      onMessagesChange([
        ...messages,
        makeMessage("assistant", response.message),
      ]);
      onPendingActionChange(null);
    } catch (requestError) {
      setError(
        getApiErrorMessage(requestError, "The change could not be saved."),
      );
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Shell $compact={compact}>
      <Conversation ref={conversationRef} aria-live="polite">
        {messages.length === 0 && (
          <Empty>
            <AssistantMark>
              <AppIcon name="assistant" size={22} />
            </AssistantMark>
            <h2>What would you like to know?</h2>
            <p>
              Compare plans with actuals, manage categories, record spending, or
              lock periods. Database changes always ask for your confirmation
              first.
            </p>
            <Suggestions>
              {suggestions.map((suggestion) => (
                <Suggestion
                  key={suggestion}
                  type="button"
                  onClick={() => void submit(suggestion)}
                >
                  {suggestion}
                </Suggestion>
              ))}
            </Suggestions>
          </Empty>
        )}

        {messages.map((message) => (
          <MessageRow key={message.id} $role={message.role}>
            <Bubble $role={message.role}>
              {message.role === "assistant" ? (
                <AssistantMarkdown content={message.content} />
              ) : (
                message.content
              )}
            </Bubble>
          </MessageRow>
        ))}

        {isSending && (
          <MessageRow $role="assistant">
            <Bubble $role="assistant">Working on it…</Bubble>
          </MessageRow>
        )}

        {pendingAction && (
          <ActionCard>
            <h3>{pendingAction.title}</h3>
            <p>{pendingAction.description}</p>
            <ActionDetails>
              {Object.entries(pendingAction.details).map(([label, value]) => (
                <Fragment key={label}>
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </Fragment>
              ))}
            </ActionDetails>
            <Actions>
              <Button onClick={() => void confirm()} disabled={isSending}>
                Confirm and save
              </Button>
              <Button
                variant="secondary"
                onClick={() => onPendingActionChange(null)}
                disabled={isSending}
              >
                Cancel
              </Button>
            </Actions>
          </ActionCard>
        )}
      </Conversation>

      <Composer onSubmit={handleSubmit}>
        <Input
          value={input}
          maxLength={2000}
          rows={1}
          placeholder="Ask about plans and spending…"
          disabled={isSending}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              void submit(input);
            }
          }}
        />
        <Button type="submit" disabled={isSending || !input.trim()}>
          Send
        </Button>
        {error ? <ErrorText role="alert">{error}</ErrorText> : null}
      </Composer>
    </Shell>
  );
}
