export interface Actual {
  id: string;
  categoryId: string;
  month: string;
  amount: number;
  note: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateActualInput {
  categoryId: string;
  month: string;
  amount: number;
  note?: string;
}

export interface UpdateActualInput {
  amount: number;
  note: string;
}

export interface ActualFilters {
  month?: string;
  categoryId?: string;
}

export interface ActualListResponse {
  success: boolean;
  actuals: Actual[];
}

export interface ActualResponse {
  success: boolean;
  message: string;
  actual: Actual;
}
