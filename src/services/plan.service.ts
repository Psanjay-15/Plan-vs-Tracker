import type {
  CreatePlanInput,
  Plan,
  PlanFilters,
  PlanListResponse,
  PlanResponse,
  UpdatePlanInput,
} from "../types/plan";
import { api } from "./api";

export const planService = {
  async getAll(filters: PlanFilters = {}): Promise<Plan[]> {
    const { data } = await api.get<PlanListResponse>("/plans", {
      params: filters,
    });
    return data.plans;
  },

  async create(input: CreatePlanInput): Promise<Plan> {
    const { data } = await api.post<PlanResponse>("/plans", input);
    return data.plan;
  },

  async update(planId: string, input: UpdatePlanInput): Promise<Plan> {
    const { data } = await api.patch<PlanResponse>(`/plans/${planId}`, input);
    return data.plan;
  },

  async remove(planId: string): Promise<void> {
    await api.delete(`/plans/${planId}`);
  },
};
