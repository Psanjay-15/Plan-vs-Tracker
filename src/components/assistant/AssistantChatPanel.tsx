import { type FormEvent, Fragment, useEffect, useRef, useState } from "react";
import styled from "styled-components";
import { AssistantCharts } from "./AssistantCharts";
import { AssistantMarkdown } from "./AssistantMarkdown";
import { AppIcon } from "../common/AppIcon";
import { Button } from "../common/Button";
import { useAssistantChat } from "../../context/AssistantChatProvider";
import { useToast } from "../../hooks/useToast";

const Shell = styled.section<{ $compact?: boolean }>`
  display: grid;
  height: 100%;
  min-height: 0;
  flex: 1;
  grid-template-rows: minmax(0, 1fr) auto;
  overflow: hidden;
  border: ${({ $compact }) => ($compact ? "0" : "1px solid var(--color-border)")};
  border-radius: ${({ $compact }) => ($compact ? "0" : "var(--radius-xl)")};
  background: ${({ $compact }) =>
    $compact ? "transparent" : "var(--color-surface)"};
  box-shadow: ${({ $compact }) => ($compact ? "none" : "var(--shadow-sm)")};
`;

const Conversation = styled.div`
  display: flex;
  min-height: 0;
  flex-direction: column;
  gap: var(--space-4);
  overflow-y: auto;
  padding: var(--space-5) var(--space-5) var(--space-4);
  background:
    radial-gradient(circle at top left, rgb(185 79 39 / 5%), transparent 34%),
    linear-gradient(180deg, rgb(255 255 255 / 35%), transparent 28%);
`;

const Empty = styled.div`
  display: grid;
  max-width: 520px;
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
  background: rgb(255 255 255 / 88%);
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
  max-width: ${({ $role }) =>
    $role === "assistant" ? "min(96%, 720px)" : "min(88%, 520px)"};
  padding: ${({ $role }) =>
    $role === "assistant" ? "0.9rem 1rem" : "0.75rem 0.95rem"};
  border: 1px solid
    ${({ $role }) =>
      $role === "user" ? "transparent" : "var(--color-border)"};
  border-radius: ${({ $role }) =>
    $role === "user"
      ? "1.1rem 1.1rem 0.35rem 1.1rem"
      : "1.1rem 1.1rem 1.1rem 0.35rem"};
  background: ${({ $role }) =>
    $role === "user"
      ? "linear-gradient(145deg, var(--color-primary-500), var(--color-primary-700))"
      : "rgb(255 255 255 / 92%)"};
  color: ${({ $role }) => ($role === "user" ? "#fff" : "var(--color-text)")};
  box-shadow: ${({ $role }) =>
    $role === "user"
      ? "0 8px 18px rgb(123 63 28 / 16%)"
      : "0 1px 2px rgb(28 25 23 / 4%)"};
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
  flex: 0 0 auto;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: var(--space-3);
  padding: 0.85rem 1rem;
  border-top: 1px solid var(--color-border);
  background: rgb(255 253 250 / 92%);
`;

const Input = styled.textarea`
  width: 100%;
  min-height: 2.9rem;
  max-height: 8rem;
  resize: none;
  padding: 0.78rem 0.95rem;
  border: 1px solid var(--color-border-strong);
  border-radius: 1rem;
  outline: none;
  background: #ffffff;
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

const LoadingNote = styled.p`
  margin: auto;
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
`;

interface AssistantChatPanelProps {
  suggestions: string[];
  compact?: boolean;
}

export function AssistantChatPanel({
  suggestions,
  compact = false,
}: AssistantChatPanelProps) {
  const toast = useToast();
  const {
    messages,
    pendingAction,
    isSending,
    isLoadingMessages,
    error,
    sendMessage,
    confirmPendingAction,
    cancelPendingAction,
  } = useAssistantChat();
  const [input, setInput] = useState("");
  const conversationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    requestAnimationFrame(() => {
      conversationRef.current?.scrollTo({
        top: conversationRef.current.scrollHeight,
        behavior: "smooth",
      });
    });
  }, [messages, pendingAction, isSending, isLoadingMessages]);

  const submit = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isSending) return;
    setInput("");
    await sendMessage(trimmed);
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    void submit(input);
  };

  const confirm = async () => {
    const message = await confirmPendingAction();
    if (message) toast.success(message);
  };

  return (
    <Shell $compact={compact}>
      <Conversation ref={conversationRef} aria-live="polite">
        {isLoadingMessages ? (
          <LoadingNote>Loading conversation…</LoadingNote>
        ) : null}

        {!isLoadingMessages && messages.length === 0 ? (
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
        ) : null}

        {!isLoadingMessages
          ? messages.map((message) => (
              <MessageRow key={message.id} $role={message.role}>
                <Bubble $role={message.role}>
                  {message.role === "assistant" ? (
                    <>
                      <AssistantMarkdown content={message.content} />
                      {message.charts ? (
                        <AssistantCharts charts={message.charts} />
                      ) : null}
                    </>
                  ) : (
                    message.content
                  )}
                </Bubble>
              </MessageRow>
            ))
          : null}

        {isSending ? (
          <MessageRow $role="assistant">
            <Bubble $role="assistant">Working on it…</Bubble>
          </MessageRow>
        ) : null}

        {pendingAction ? (
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
                onClick={cancelPendingAction}
                disabled={isSending}
              >
                Cancel
              </Button>
            </Actions>
          </ActionCard>
        ) : null}
      </Conversation>

      <Composer onSubmit={handleSubmit}>
        <Input
          value={input}
          maxLength={2000}
          rows={1}
          placeholder="Ask about plans and spending…"
          disabled={isSending || isLoadingMessages}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              void submit(input);
            }
          }}
        />
        <Button
          type="submit"
          disabled={isSending || isLoadingMessages || !input.trim()}
        >
          Send
        </Button>
        {error ? <ErrorText role="alert">{error}</ErrorText> : null}
      </Composer>
    </Shell>
  );
}
