export interface Category {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryInput {
  name: string;
}

export interface CategoryListResponse {
  success: boolean;
  categories: Category[];
}

export interface CategoryResponse {
  success: boolean;
  message: string;
  category: Category;
}
