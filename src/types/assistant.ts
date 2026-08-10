export interface AssistantMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export type AssistantActionType =
  | "create_category"
  | "update_category"
  | "delete_category"
  | "upsert_plan"
  | "delete_plan"
  | "create_actual"
  | "update_actual"
  | "delete_actual"
  | "lock_period";

export interface PendingAssistantAction {
  token: string;
  type: AssistantActionType;
  title: string;
  description: string;
  details: Record<string, string>;
}

export interface AssistantChatResponse {
  success: boolean;
  message: string;
  pendingAction?: PendingAssistantAction;
}
