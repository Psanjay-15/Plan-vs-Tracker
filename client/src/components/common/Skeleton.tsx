import styled, { keyframes } from "styled-components";

const shimmer = keyframes`
  0% { background-position: 100% 0; }
  100% { background-position: -100% 0; }
`;

export const SkeletonPulse = styled.div<{
  $height?: string;
  $width?: string;
  $radius?: string;
}>`
  width: ${({ $width }) => $width ?? "100%"};
  height: ${({ $height }) => $height ?? "1rem"};
  border-radius: ${({ $radius }) => $radius ?? "var(--radius-md)"};
  background: linear-gradient(
    90deg,
    #efe7de 0%,
    #f7f1ea 45%,
    #efe7de 90%
  );
  background-size: 200% 100%;
  animation: ${shimmer} 1.2s ease-in-out infinite;
`;

export const SkeletonCard = styled.div`
  display: grid;
  gap: 0.75rem;
  padding: var(--space-5);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  background: var(--color-surface);
  box-shadow: var(--shadow-sm);
`;

export const SkeletonRow = styled.div`
  display: grid;
  grid-template-columns: 1.4fr 1fr 1fr 1fr;
  gap: var(--space-3);
  padding: 0.75rem 0;
  border-bottom: 1px solid var(--color-border);

  &:last-child {
    border-bottom: 0;
  }
`;
