import { useMemo, useState } from "react";
import { PageHeader } from "../components/common/PageHeader";
import { AssistantChatPanel } from "../components/assistant/AssistantChatPanel";
import type { AssistantMessage, PendingAssistantAction } from "../types/assistant";

export function AssistantPage() {
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [pendingAction, setPendingAction] =
    useState<PendingAssistantAction | null>(null);

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
    <>
      <PageHeader
        title="Ask your data"
        description="Search, compare, and record spending using everyday language."
      />
      <AssistantChatPanel
        suggestions={suggestions}
        messages={messages}
        onMessagesChange={setMessages}
        pendingAction={pendingAction}
        onPendingActionChange={setPendingAction}
      />
    </>
  );
}
