import { useMemo, useState } from "react";
import styled from "styled-components";
import { AssistantChatPanel } from "../components/assistant/AssistantChatPanel";
import { AssistantSessionSidebar } from "../components/assistant/AssistantSessionSidebar";
import { Button } from "../components/common/Button";
import { useAssistantChat } from "../context/AssistantChatProvider";

const Shell = styled.div`
  display: flex;
  height: 100%;
  max-height: 100%;
  min-height: 0;
  flex: 1;
  flex-direction: column;
  gap: var(--space-3);
  overflow: hidden;

  @media (max-width: 860px) {
    height: min(100dvh - 8rem, 900px);
    max-height: min(100dvh - 8rem, 900px);
  }
`;

const TopBar = styled.header`
  display: flex;
  flex: 0 0 auto;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--space-4);

  h1 {
    margin: 0 0 0.2rem;
    font-size: var(--font-size-2xl);
    letter-spacing: -0.03em;
    line-height: var(--line-height-tight);
  }

  p {
    margin: 0;
    color: var(--color-text-muted);
    font-size: var(--font-size-sm);
  }

  @media (max-width: 640px) {
    align-items: stretch;
    flex-direction: column;
  }
`;

const TopActions = styled.div`
  display: none;
  gap: var(--space-2);

  @media (max-width: 860px) {
    display: flex;
    flex-wrap: wrap;
  }
`;

const Workspace = styled.div`
  display: grid;
  min-height: 0;
  flex: 1;
  overflow: hidden;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  background:
    linear-gradient(180deg, rgb(255 252 248 / 88%), rgb(255 255 255 / 96%)),
    var(--color-surface);
  box-shadow: var(--shadow-sm);
  grid-template-columns: 260px minmax(0, 1fr);

  @media (max-width: 860px) {
    grid-template-columns: 1fr;
  }
`;

const DesktopSidebar = styled.div`
  min-width: 0;
  min-height: 0;
  border-right: 1px solid var(--color-border);
  background: rgb(250 246 241 / 70%);

  @media (max-width: 860px) {
    display: none;
  }
`;

const MobileHistory = styled.div`
  max-height: 40%;
  overflow: auto;
  border-bottom: 1px solid var(--color-border);
  background: rgb(250 246 241 / 70%);
`;

const ChatPane = styled.div`
  display: flex;
  min-width: 0;
  min-height: 0;
  flex-direction: column;
  overflow: hidden;
`;

export function AssistantPage() {
  const { startNewChat } = useAssistantChat();
  const [showHistory, setShowHistory] = useState(false);

  const suggestions = useMemo(
    () => [
      "Create a category called Travel",
      "Compare my plan and actuals for this month",
      "Show my biggest overspending category this year",
      "List actual entries for the last three months",
      "Record 250 in Tools for this month",
    ],
    [],
  );

  return (
    <Shell>
      <TopBar>
        <div>
          <h1>Ask your data</h1>
          <p>Chat about plans and spending. Past chats stay here so you can continue anytime.</p>
        </div>
        <TopActions>
          <Button type="button" variant="secondary" onClick={startNewChat}>
            New chat
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => setShowHistory((value) => !value)}
          >
            {showHistory ? "Hide history" : "History"}
          </Button>
        </TopActions>
      </TopBar>

      <Workspace>
        <DesktopSidebar>
          <AssistantSessionSidebar />
        </DesktopSidebar>
        <ChatPane>
          {showHistory ? (
            <MobileHistory>
              <AssistantSessionSidebar compact />
            </MobileHistory>
          ) : null}
          <AssistantChatPanel suggestions={suggestions} compact />
        </ChatPane>
      </Workspace>
    </Shell>
  );
}
