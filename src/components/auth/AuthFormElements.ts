import styled from "styled-components";

export const AuthForm = styled.form`
  display: grid;
  gap: var(--space-5);
`;

export const FormError = styled.div`
  padding: var(--space-3) var(--space-4);
  border: 1px solid rgb(217 45 32 / 28%);
  border-radius: var(--radius-md);
  background: var(--color-danger-50);
  color: var(--color-danger-600);
  font-size: var(--font-size-sm);
`;
