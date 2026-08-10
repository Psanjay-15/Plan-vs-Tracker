export interface AssistantMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  charts?: AssistantChart[];
  createdAt?: string;
}

export interface ChatSession {
  id: string;
  title: string;
  lastMessageAt: string;
  createdAt: string;
  updatedAt: string;
}

export type AssistantChartType =
  | "plan_actual_bars"
  | "monthly_variance"
  | "category_spend";

export interface AssistantChartPoint {
  key: string;
  label: string;
  plan?: number;
  actual?: number;
  variance?: number;
  value?: number;
}

export interface AssistantChart {
  id: string;
  title: string;
  type: AssistantChartType;
  points: AssistantChartPoint[];
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
  sessionId: string;
  session: ChatSession;
  userMessage: AssistantMessage;
  assistantMessage: AssistantMessage;
  pendingAction?: PendingAssistantAction;
  charts?: AssistantChart[];
}
