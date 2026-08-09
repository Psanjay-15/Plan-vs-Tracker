import styled from "styled-components";
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

export function WelcomePage() {
  const { user, isAuthenticated, isLoading } = useAuth();

  const statusText = isLoading
    ? "Checking your session..."
    : isAuthenticated
      ? `Signed in as ${user?.name}`
      : "Frontend foundation is ready";

  return (
    <PageContainer>
      <Content>
        <Eyebrow>Financial planning workspace</Eyebrow>
        <Title>Plan with clarity. Track what actually happened.</Title>
        <Description>
          Set monthly targets, record spending, lock completed periods, and
          understand every variance from one focused workspace.
        </Description>
      </Content>
    </PageContainer>
  );
}
