import { createHmac, timingSafeEqual } from "node:crypto";

interface ActionBase {
  userId: string;
  expiresAt: number;
}

export interface CreateCategoryAction extends ActionBase {
  type: "create_category";
  name: string;
}

export interface UpdateCategoryAction extends ActionBase {
  type: "update_category";
  categoryId: string;
  name: string;
  previousName: string;
}

export interface DeleteCategoryAction extends ActionBase {
  type: "delete_category";
  categoryId: string;
  categoryName: string;
}

export interface UpsertPlanAction extends ActionBase {
  type: "upsert_plan";
  categoryId: string;
  categoryName: string;
  month: string;
  amount: number;
  planId?: string;
}

export interface DeletePlanAction extends ActionBase {
  type: "delete_plan";
  planId: string;
  categoryId: string;
  categoryName: string;
  month: string;
  amount: number;
}

export interface CreateActualAction extends ActionBase {
  type: "create_actual";
  categoryId: string;
  categoryName: string;
  month: string;
  amount: number;
  note?: string;
}

export interface UpdateActualAction extends ActionBase {
  type: "update_actual";
  actualId: string;
  categoryId: string;
  categoryName: string;
  month: string;
  amount: number;
  note?: string;
}

export interface DeleteActualAction extends ActionBase {
  type: "delete_actual";
  actualId: string;
  categoryId: string;
  categoryName: string;
  month: string;
  amount: number;
  note?: string;
}

export interface LockPeriodAction extends ActionBase {
  type: "lock_period";
  month: string;
}

export type AssistantAction =
  | CreateCategoryAction
  | UpdateCategoryAction
  | DeleteCategoryAction
  | UpsertPlanAction
  | DeletePlanAction
  | CreateActualAction
  | UpdateActualAction
  | DeleteActualAction
  | LockPeriodAction;

export type AssistantActionType = AssistantAction["type"];

const ACTION_TYPES = new Set<AssistantActionType>([
  "create_category",
  "update_category",
  "delete_category",
  "upsert_plan",
  "delete_plan",
  "create_actual",
  "update_actual",
  "delete_actual",
  "lock_period",
]);

export type AssistantActionInput = AssistantAction extends infer Action
  ? Action extends AssistantAction
    ? Omit<Action, "expiresAt">
    : never
  : never;

const getSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not configured");
  return secret;
};

const sign = (payload: string) =>
  createHmac("sha256", getSecret()).update(payload).digest("base64url");

export const createActionToken = (action: AssistantActionInput) => {
  const payload = Buffer.from(
    JSON.stringify({ ...action, expiresAt: Date.now() + 10 * 60 * 1000 }),
  ).toString("base64url");
  return `${payload}.${sign(payload)}`;
};

export const verifyActionToken = (token: string): AssistantAction => {
  const [payload, signature, extra] = token.split(".");
  if (!payload || !signature || extra) throw new Error("Invalid action token");

  const expected = Buffer.from(sign(payload));
  const received = Buffer.from(signature);
  if (
    expected.length !== received.length ||
    !timingSafeEqual(expected, received)
  ) {
    throw new Error("Invalid action token");
  }

  const action = JSON.parse(
    Buffer.from(payload, "base64url").toString("utf8"),
  ) as AssistantAction;

  if (!ACTION_TYPES.has(action.type) || action.expiresAt < Date.now()) {
    throw new Error("Expired or unsupported action token");
  }

  return action;
};
