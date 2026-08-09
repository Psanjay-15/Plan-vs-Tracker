import type { ReactNode } from "react";
import styled from "styled-components";

const Header = styled.header`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-6);
  margin-bottom: var(--space-6);

  @media (max-width: 640px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

const Title = styled.h1`
  margin-bottom: var(--space-1);
  font-size: var(--font-size-3xl);
  line-height: var(--line-height-tight);
  letter-spacing: -0.035em;
`;

const Description = styled.p`
  max-width: 720px;
  margin-bottom: 0;
  color: var(--color-text-muted);
`;

interface PageHeaderProps {
  action?: ReactNode;
  description: string;
  title: string;
}

export function PageHeader({ action, description, title }: PageHeaderProps) {
  return (
    <Header>
      <div>
        <Title>{title}</Title>
        <Description>{description}</Description>
      </div>
      {action}
    </Header>
  );
}
