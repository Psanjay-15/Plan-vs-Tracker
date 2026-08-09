import styled from "styled-components";

export const PageContainer = styled.main`
  width: min(100% - 2rem, 1200px);
  min-height: 100vh;
  margin-inline: auto;
  padding-block: var(--space-12);

  @media (max-width: 640px) {
    width: min(100% - 1.25rem, 1200px);
    padding-block: var(--space-8);
  }
`;
