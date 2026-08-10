export interface Plan {
  id: string;
  categoryId: string;
  month: string;
  amount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePlanInput {
  categoryId: string;
  month: string;
  amount: number;
}

export interface UpdatePlanInput {
  amount: number;
}

export interface PlanFilters {
  month?: string;
  categoryId?: string;
}

export interface PlanListResponse {
  success: boolean;
  plans: Plan[];
}

export interface PlanResponse {
  success: boolean;
  message: string;
  plan: Plan;
}
