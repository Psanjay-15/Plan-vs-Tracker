import styled from "styled-components";
import { Link } from "react-router-dom";
import { PageContainer } from "../components/layout/PageContainer";

const Content = styled.div`
  max-width: 560px;
  margin: 18vh auto 0;
  text-align: center;
`;

const Title = styled.h1`
  margin-bottom: var(--space-3);
  font-size: var(--font-size-3xl);
`;

const Description = styled.p`
  margin-bottom: var(--space-6);
  color: var(--color-text-muted);
`;

export function NotFoundPage() {
  return (
    <PageContainer>
      <Content>
        <Title>Page not found</Title>
        <Description>The page you requested does not exist.</Description>
        <Link to="/">Return home</Link>
      </Content>
    </PageContainer>
  );
}
