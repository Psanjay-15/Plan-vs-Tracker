import type { PropsWithChildren } from "react";
import { Navigate, useLocation } from "react-router-dom";
import styled from "styled-components";
import { useAuth } from "../hooks/useAuth";

const LoadingPage = styled.main`
  display: grid;
  min-height: 100vh;
  place-items: center;
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
`;

export function ProtectedRoute({ children }: PropsWithChildren) {
  const location = useLocation();
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingPage>Loading your workspace...</LoadingPage>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return children;
}
