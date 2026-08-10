import OpenAI from "openai";
import type {
  ChatCompletionMessageParam,
  ChatCompletionTool,
} from "openai/resources/chat/completions";
import User from "../models/User";
import { getCountryCurrency } from "../constants/currencies";
import {
  runAssistantTool,
  type PendingAssistantAction,
} from "./assistant-tools.service";

export interface AssistantHistoryMessage {
  role: "user" | "assistant";
  content: string;
}

export type { PendingAssistantAction };

const tools: ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "list_categories",
      description: "List the user's spending categories.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "list_plans",
      description: "List monthly plan targets for a date range.",
      parameters: {
        type: "object",
        properties: {
          startMonth: { type: "string", description: "YYYY-MM" },
          endMonth: { type: "string", description: "YYYY-MM" },
          categoryName: { type: "string", description: "Optional exact category name" },
        },
        required: ["startMonth", "endMonth"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_period_locks",
      description: "List locked months for the user.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "get_plan_vs_actual",
      description:
        "Get aggregated plan, actual, variance, monthly totals, and category rows for a month range.",
      parameters: {
        type: "object",
        properties: {
          startMonth: { type: "string", description: "YYYY-MM" },
          endMonth: { type: "string", description: "YYYY-MM" },
          categoryName: { type: "string", description: "Optional exact category name" },
        },
        required: ["startMonth", "endMonth"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_actual_entries",
      description:
        "List individual actual spending entries, including ids and notes, for drill-down or edits.",
      parameters: {
        type: "object",
        properties: {
          startMonth: { type: "string", description: "YYYY-MM" },
          endMonth: { type: "string", description: "YYYY-MM" },
          categoryName: { type: "string", description: "Optional exact category name" },
        },
        required: ["startMonth", "endMonth"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "propose_create_category",
      description:
        "Propose creating a new spending category. Never writes immediately; requires user confirmation.",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "New category name" },
        },
        required: ["name"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "propose_rename_category",
      description:
        "Propose renaming an existing category. Requires user confirmation.",
      parameters: {
        type: "object",
        properties: {
          currentName: { type: "string" },
          newName: { type: "string" },
        },
        required: ["currentName", "newName"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "propose_delete_category",
      description:
        "Propose deleting an unused category. Requires user confirmation.",
      parameters: {
        type: "object",
        properties: {
          categoryName: { type: "string" },
        },
        required: ["categoryName"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "propose_plan",
      description:
        "Propose creating or updating a monthly plan amount for a category. Requires user confirmation.",
      parameters: {
        type: "object",
        properties: {
          categoryName: { type: "string" },
          month: { type: "string", description: "YYYY-MM" },
          amount: {
            type: "number",
            description: "Plan amount in major currency units, including 0",
          },
        },
        required: ["categoryName", "month", "amount"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "propose_delete_plan",
      description:
        "Propose deleting a monthly plan for a category. Requires user confirmation.",
      parameters: {
        type: "object",
        properties: {
          categoryName: { type: "string" },
          month: { type: "string", description: "YYYY-MM" },
        },
        required: ["categoryName", "month"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "propose_actual_entry",
      description:
        "Propose a new actual spending entry. Requires user confirmation.",
      parameters: {
        type: "object",
        properties: {
          categoryName: { type: "string" },
          month: { type: "string", description: "YYYY-MM" },
          amount: {
            type: "number",
            description: "Positive amount in major currency units, for example 25.50",
          },
          note: { type: "string" },
        },
        required: ["categoryName", "month", "amount"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "propose_update_actual",
      description:
        "Propose updating an existing actual entry by id. Requires user confirmation.",
      parameters: {
        type: "object",
        properties: {
          actualId: { type: "string" },
          amount: { type: "number" },
          note: { type: "string" },
        },
        required: ["actualId"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "propose_delete_actual",
      description:
        "Propose deleting an existing actual entry by id. Requires user confirmation.",
      parameters: {
        type: "object",
        properties: {
          actualId: { type: "string" },
        },
        required: ["actualId"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "propose_lock_period",
      description:
        "Propose locking a month so plans and actuals become read-only. Requires user confirmation.",
      parameters: {
        type: "object",
        properties: {
          month: { type: "string", description: "YYYY-MM" },
        },
        required: ["month"],
      },
    },
  },
];

const getClient = () => {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    ...(process.env.OPENAI_BASE_URL
      ? { baseURL: process.env.OPENAI_BASE_URL }
      : {}),
  });
};

export const askAssistant = async (
  userId: string,
  message: string,
  history: AssistantHistoryMessage[],
) => {
  const user = await User.findById(userId).select("name countryCode").lean();
  if (!user) throw new Error("User not found");

  const currency = getCountryCurrency(user.countryCode);
  const today = new Date().toISOString().slice(0, 10);
  const messages: ChatCompletionMessageParam[] = [
    {
      role: "system",
      content: `You are the Plan vs Actual financial assistant for ${user.name}. Today is ${today}. The user's currency is ${currency.currency}; tool amounts in stored data are integer minor units and must be divided by 100 when presented.

Rules:
- Use tools for every claim about their data. Never invent values.
- Read with list_categories, list_plans, list_period_locks, get_plan_vs_actual, and list_actual_entries.
- For any create/update/delete/lock change, ONLY use the matching propose_* tool. Those tools never write immediately; the UI asks the human to confirm first.
- Never claim that a write already succeeded.
- You CAN create new categories with propose_create_category. Do not say categories must already exist.
- If a write request is missing required fields, ask for the missing values.
- Keep answers concise and calculation-focused. Mention when no matching data exists.`,
    },
    ...history.slice(-10),
    { role: "user", content: message },
  ];

  const client = getClient();

  for (let turn = 0; turn < 5; turn += 1) {
    const completion = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      messages,
      tools,
      tool_choice: "auto",
      temperature: 0.1,
    });

    const response = completion.choices[0]?.message;
    if (!response) throw new Error("The assistant returned no response");
    messages.push(response);

    if (!response.tool_calls?.length) {
      return {
        message:
          response.content?.trim() || "I could not complete that request.",
      };
    }

    for (const call of response.tool_calls) {
      if (call.type !== "function") continue;

      try {
        const input = JSON.parse(call.function.arguments) as Record<
          string,
          unknown
        >;
        const output = await runAssistantTool(
          userId,
          call.function.name,
          input,
        );

        if (output.pendingAction) {
          return {
            message:
              response.content?.trim() ||
              "Please review and confirm this change before I save it.",
            pendingAction: output.pendingAction,
          };
        }

        messages.push({
          role: "tool",
          tool_call_id: call.id,
          content: JSON.stringify(output.result),
        });
      } catch (error) {
        messages.push({
          role: "tool",
          tool_call_id: call.id,
          content: JSON.stringify({
            error: error instanceof Error ? error.message : "Tool failed",
          }),
        });
      }
    }
  }

  throw new Error("The assistant used too many tool steps");
};
