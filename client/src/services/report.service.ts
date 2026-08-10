import type { ReportFilters, ReportResponse } from "../types/report";
import { api } from "./api";

export const reportService = {
  async getPlanVsActual(filters: ReportFilters): Promise<ReportResponse> {
    const { data } = await api.get<ReportResponse>(
      "/reports/plan-vs-actual",
      { params: filters },
    );
    return data;
  },
};
