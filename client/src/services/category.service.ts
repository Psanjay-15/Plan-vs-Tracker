import type {
  Category,
  CategoryInput,
  CategoryListResponse,
  CategoryResponse,
} from "../types/category";
import { api } from "./api";

export const categoryService = {
  async getAll(): Promise<Category[]> {
    const { data } = await api.get<CategoryListResponse>("/categories");
    return data.categories;
  },

  async create(input: CategoryInput): Promise<Category> {
    const { data } = await api.post<CategoryResponse>("/categories", input);
    return data.category;
  },

  async update(categoryId: string, input: CategoryInput): Promise<Category> {
    const { data } = await api.patch<CategoryResponse>(
      `/categories/${categoryId}`,
      input,
    );
    return data.category;
  },

  async remove(categoryId: string): Promise<void> {
    await api.delete(`/categories/${categoryId}`);
  },
};
