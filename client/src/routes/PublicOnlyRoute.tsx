import type { PropsWithChildren } from "react";
import { Navigate } from "react-router-dom";
import styled from "styled-components";
import { useAuth } from "../hooks/useAuth";

const LoadingPage = styled.main`
  display: grid;
  min-height: 100vh;
  place-items: center;
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
`;

export function PublicOnlyRoute({ children }: PropsWithChildren) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingPage>Checking your session...</LoadingPage>;
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
