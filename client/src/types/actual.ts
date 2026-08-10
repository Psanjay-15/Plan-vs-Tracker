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
  startMonth?: string;
  endMonth?: string;
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

export interface ActualCsvImportError {
  row: number;
  message: string;
}

export interface ActualCsvImportResponse {
  success: boolean;
  message: string;
  imported: number;
  failed: number;
  errors: ActualCsvImportError[];
  actuals: Actual[];
}
