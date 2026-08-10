import type {
  Actual,
  ActualCsvImportResponse,
  ActualFilters,
  ActualListResponse,
  ActualResponse,
  CreateActualInput,
  UpdateActualInput,
} from "../types/actual";
import { api } from "./api";

export const actualService = {
  async getAll(filters: ActualFilters = {}): Promise<Actual[]> {
    const { data } = await api.get<ActualListResponse>("/actuals", {
      params: filters,
    });
    return data.actuals;
  },

  async create(input: CreateActualInput): Promise<Actual> {
    const { data } = await api.post<ActualResponse>("/actuals", input);
    return data.actual;
  },

  async update(actualId: string, input: UpdateActualInput): Promise<Actual> {
    const { data } = await api.patch<ActualResponse>(
      `/actuals/${actualId}`,
      input,
    );
    return data.actual;
  },

  async remove(actualId: string): Promise<void> {
    await api.delete(`/actuals/${actualId}`);
  },

  async exportCsv(filters: ActualFilters = {}): Promise<Blob> {
    const { data } = await api.get<Blob>("/actuals/export", {
      params: filters,
      responseType: "blob",
    });
    return data;
  },

  async importCsv(csv: string): Promise<ActualCsvImportResponse> {
    const { data } = await api.post<ActualCsvImportResponse>(
      "/actuals/import",
      { csv },
    );
    return data;
  },
};
