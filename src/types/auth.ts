export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface SignupInput extends LoginInput {
  name: string;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  user: User;
}
