import styled from "styled-components";
import { useAssistantChat } from "../../context/AssistantChatProvider";

const Sidebar = styled.aside<{ $compact?: boolean }>`
  display: flex;
  height: 100%;
  min-width: 0;
  min-height: 0;
  flex-direction: column;
  gap: var(--space-3);
  width: ${({ $compact }) => ($compact ? "100%" : "100%")};
  padding: ${({ $compact }) =>
    $compact ? "var(--space-3)" : "var(--space-4) var(--space-3)"};
`;

const Header = styled.div`
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
  padding: 0 0.15rem;

  h2 {
    margin: 0;
    color: var(--color-text-muted);
    font-size: 0.72rem;
    font-weight: 750;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }
`;

const NewChatButton = styled.button`
  padding: 0.4rem 0.65rem;
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-full);
  background: var(--color-surface);
  color: var(--color-text);
  font-size: var(--font-size-xs);
  font-weight: 650;
  cursor: pointer;

  &:hover {
    border-color: var(--color-primary-500);
    background: var(--color-primary-50);
    color: var(--color-primary-700);
  }
`;

const SessionList = styled.div`
  display: grid;
  min-height: 0;
  flex: 1;
  align-content: start;
  gap: 0.3rem;
  overflow: auto;
  padding-right: 0.15rem;
`;

const SessionRow = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 0.15rem;
  align-items: stretch;
`;

const SessionButton = styled.button<{ $active?: boolean }>`
  display: grid;
  gap: 0.18rem;
  width: 100%;
  padding: 0.65rem 0.7rem;
  border: 0;
  border-radius: var(--radius-md);
  background: ${({ $active }) =>
    $active ? "var(--color-primary-50)" : "transparent"};
  box-shadow: ${({ $active }) =>
    $active ? "inset 3px 0 0 var(--color-primary-600)" : "none"};
  color: var(--color-text);
  text-align: left;
  cursor: pointer;

  strong {
    overflow: hidden;
    font-size: var(--font-size-xs);
    font-weight: 650;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  span {
    color: var(--color-text-muted);
    font-size: 0.68rem;
  }

  &:hover {
    background: ${({ $active }) =>
      $active ? "var(--color-primary-50)" : "rgb(255 255 255 / 72%)"};
  }
`;

const DeleteButton = styled.button`
  align-self: center;
  width: 1.7rem;
  height: 1.7rem;
  border: 0;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--color-text-muted);
  font-size: 0.9rem;
  line-height: 1;
  cursor: pointer;
  opacity: 0.55;

  ${SessionRow}:hover & {
    opacity: 1;
  }

  &:hover {
    color: var(--color-danger-600);
    background: var(--color-danger-50);
  }
`;

const Empty = styled.p`
  margin: var(--space-3) 0.35rem 0;
  color: var(--color-text-muted);
  font-size: var(--font-size-xs);
  line-height: 1.45;
`;

const formatSessionTime = (value: string) =>
  new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));

interface AssistantSessionSidebarProps {
  compact?: boolean;
}

export function AssistantSessionSidebar({
  compact = false,
}: AssistantSessionSidebarProps) {
  const {
    sessions,
    activeSessionId,
    isLoadingSessions,
    startNewChat,
    selectSession,
    deleteSession,
  } = useAssistantChat();

  return (
    <Sidebar $compact={compact}>
      <Header>
        <h2>Chats</h2>
        <NewChatButton type="button" onClick={startNewChat}>
          New chat
        </NewChatButton>
      </Header>

      <SessionList>
        {isLoadingSessions ? <Empty>Loading history…</Empty> : null}
        {!isLoadingSessions && sessions.length === 0 ? (
          <Empty>No saved chats yet. Send a message to start one.</Empty>
        ) : null}
        {sessions.map((session) => (
          <SessionRow key={session.id}>
            <SessionButton
              type="button"
              $active={session.id === activeSessionId}
              onClick={() => void selectSession(session.id)}
            >
              <strong>{session.title}</strong>
              <span>{formatSessionTime(session.lastMessageAt)}</span>
            </SessionButton>
            <DeleteButton
              type="button"
              aria-label={`Delete ${session.title}`}
              onClick={() => void deleteSession(session.id)}
            >
              ×
            </DeleteButton>
          </SessionRow>
        ))}
      </SessionList>
    </Sidebar>
  );
}
