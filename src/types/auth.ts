export interface User {
  id: string;
  name: string;
  email: string;
  countryCode: string;
  currency: string;
  currencyName: string;
  locale: string;
  createdAt: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface SignupInput extends LoginInput {
  name: string;
  countryCode?: string;
}

export interface UpdatePreferencesInput {
  countryCode: string;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  user: User;
}
