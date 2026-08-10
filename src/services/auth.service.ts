import { api } from "./api";
import type {
  AuthResponse,
  ChangePasswordInput,
  ForgotPasswordInput,
  LoginInput,
  MessageResponse,
  ResetPasswordInput,
  SignupInput,
  UpdatePreferencesInput,
  User,
} from "../types/auth";

export const authService = {
  async signup(input: SignupInput): Promise<User> {
    const { data } = await api.post<AuthResponse>("/auth/signup", input);
    return data.user;
  },

  async login(input: LoginInput): Promise<User> {
    const { data } = await api.post<AuthResponse>("/auth/login", input);
    return data.user;
  },

  async logout(): Promise<void> {
    await api.post("/auth/logout");
  },

  async getCurrentUser(): Promise<User> {
    const { data } = await api.get<AuthResponse>("/auth/me");
    return data.user;
  },

  async updatePreferences(input: UpdatePreferencesInput): Promise<User> {
    const { data } = await api.patch<AuthResponse>("/auth/preferences", input);
    return data.user;
  },

  async changePassword(input: ChangePasswordInput): Promise<string> {
    const { data } = await api.patch<MessageResponse>("/auth/password", input);
    return data.message;
  },

  async forgotPassword(input: ForgotPasswordInput): Promise<string> {
    const { data } = await api.post<MessageResponse>(
      "/auth/forgot-password",
      input,
    );
    return data.message;
  },

  async resetPassword(input: ResetPasswordInput): Promise<User> {
    const { data } = await api.post<AuthResponse>("/auth/reset-password", input);
    return data.user;
  },
};
