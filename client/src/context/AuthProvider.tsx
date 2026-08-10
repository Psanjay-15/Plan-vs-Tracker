import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";
import { authService } from "../services/auth.service";
import type {
  LoginInput,
  SignupInput,
  UpdatePreferencesInput,
  User,
} from "../types/auth";
import { AuthContext, type AuthContextValue } from "./auth-context";

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const currentUser = await authService.getCurrentUser();
      setUser(currentUser);
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let isActive = true;

    authService
      .getCurrentUser()
      .then((currentUser) => {
        if (isActive) setUser(currentUser);
      })
      .catch(() => {
        if (isActive) setUser(null);
      })
      .finally(() => {
        if (isActive) setIsLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, []);

  const login = useCallback(async (input: LoginInput) => {
    const authenticatedUser = await authService.login(input);
    setUser(authenticatedUser);
  }, []);

  const signup = useCallback(async (input: SignupInput) => {
    const authenticatedUser = await authService.signup(input);
    setUser(authenticatedUser);
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    setUser(null);
  }, []);

  const updatePreferences = useCallback(
    async (input: UpdatePreferencesInput) => {
      const updatedUser = await authService.updatePreferences(input);
      setUser(updatedUser);
    },
    [],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isLoading,
      login,
      signup,
      logout,
      refreshUser,
      updatePreferences,
    }),
    [
      isLoading,
      login,
      logout,
      refreshUser,
      signup,
      updatePreferences,
      user,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
