import { useState } from "react";
import { Link } from "react-router-dom";
import styled from "styled-components";
import { Button } from "../components/common/Button";
import { Card } from "../components/common/Card";
import { PageContainer } from "../components/layout/PageContainer";
import { useAuth } from "../hooks/useAuth";

const Content = styled.div`
  max-width: 720px;
  margin: 12vh auto 0;
`;

const Eyebrow = styled.p`
  margin-bottom: var(--space-3);
  color: var(--color-primary-600);
  font-size: var(--font-size-sm);
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
`;

const Title = styled.h1`
  margin-bottom: var(--space-4);
  color: var(--color-text);
  font-size: clamp(2.25rem, 7vw, 4.5rem);
  line-height: 1.02;
  letter-spacing: -0.05em;
`;

const Description = styled.p`
  max-width: 620px;
  margin-bottom: var(--space-8);
  color: var(--color-text-muted);
  font-size: var(--font-size-lg);
`;

const Status = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-3);
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
`;

const StatusDot = styled.span<{ $active: boolean }>`
  width: 0.625rem;
  height: 0.625rem;
  flex: 0 0 auto;
  border-radius: var(--radius-full);
  background: ${({ $active }) =>
    $active ? "var(--color-success-600)" : "var(--color-text-subtle)"};
`;

const Actions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
  margin-top: var(--space-6);
`;

const ActionLink = styled(Link)<{ $primary?: boolean }>`
  display: inline-flex;
  min-height: 2.75rem;
  align-items: center;
  justify-content: center;
  padding: 0.7rem 1.1rem;
  border: 1px solid
    ${({ $primary }) =>
      $primary ? "var(--color-primary-600)" : "var(--color-border-strong)"};
  border-radius: var(--radius-md);
  background: ${({ $primary }) =>
    $primary ? "var(--color-primary-600)" : "var(--color-surface)"};
  color: ${({ $primary }) => ($primary ? "#ffffff" : "var(--color-text)")};
  font-weight: 650;
  line-height: 1;
  text-decoration: none;
`;

export function WelcomePage() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const statusText = isLoading
    ? "Checking your session..."
    : isAuthenticated
      ? `Signed in as ${user?.name}`
      : "Sign in or create an account to continue";

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <PageContainer>
      <Content>
        <Eyebrow>Financial planning workspace</Eyebrow>
        <Title>Plan with clarity. Track what actually happened.</Title>
        <Description>
          Set monthly targets, record spending, lock completed periods, and
          understand every variance from one focused workspace.
        </Description>

        <Card>
          <Status>
            <StatusDot $active={!isLoading} />
            {statusText}
          </Status>

          {!isLoading ? (
            <Actions>
              {isAuthenticated ? (
                <Button
                  variant="secondary"
                  disabled={isLoggingOut}
                  onClick={() => void handleLogout()}
                >
                  {isLoggingOut ? "Signing out..." : "Sign out"}
                </Button>
              ) : (
                <>
                  <ActionLink to="/login">Sign in</ActionLink>
                  <ActionLink to="/signup" $primary>
                    Create account
                  </ActionLink>
                </>
              )}
            </Actions>
          ) : null}
        </Card>
      </Content>
    </PageContainer>
  );
}
