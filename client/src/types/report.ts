export interface ReportFilters {
  startMonth: string;
  endMonth: string;
  categoryId?: string;
}

export interface ReportSummary {
  totalPlan: number;
  totalActual: number;
  totalVariance: number;
  variancePercentage: number | null;
}

export interface ReportRow {
  categoryId: string;
  categoryName: string;
  month: string;
  plan: number;
  actual: number;
  variance: number;
  variancePercentage: number | null;
  actualEntryCount: number;
  locked: boolean;
}

export interface MonthlyReportTotal {
  month: string;
  plan: number;
  actual: number;
  variance: number;
  variancePercentage: number | null;
  locked: boolean;
}

export interface ReportResponse {
  success: boolean;
  rules: {
    missingActual: "treated_as_zero";
    zeroPlanVariancePercentage: null;
    percentagePrecision: number;
    moneyUnit: "minor_unit";
  };
  range: {
    startMonth: string;
    endMonth: string;
  };
  summary: ReportSummary;
  rows: ReportRow[];
  monthlyTotals: MonthlyReportTotal[];
}
