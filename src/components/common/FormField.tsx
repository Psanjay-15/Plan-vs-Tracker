import type { InputHTMLAttributes } from "react";
import styled from "styled-components";

const Field = styled.div`
  display: grid;
  gap: var(--space-2);
`;

const Label = styled.label`
  color: var(--color-text);
  font-size: var(--font-size-sm);
  font-weight: 650;
`;

const Input = styled.input<{ $hasError: boolean }>`
  width: 100%;
  min-height: 2.75rem;
  padding: 0.65rem 0.8rem;
  border: 1px solid
    ${({ $hasError }) =>
      $hasError ? "var(--color-danger-600)" : "var(--color-border-strong)"};
  border-radius: var(--radius-md);
  outline: none;
  background: var(--color-surface);
  color: var(--color-text);
  box-shadow: var(--shadow-sm);
  transition:
    border-color 150ms ease,
    box-shadow 150ms ease;

  &::placeholder {
    color: var(--color-text-subtle);
  }

  &:focus {
    border-color: ${({ $hasError }) =>
      $hasError ? "var(--color-danger-600)" : "var(--color-primary-500)"};
    box-shadow: ${({ $hasError }) =>
      $hasError ? "0 0 0 3px rgb(217 45 32 / 14%)" : "var(--focus-ring)"};
  }
`;

const ErrorText = styled.p`
  margin: 0;
  color: var(--color-danger-600);
  font-size: var(--font-size-xs);
`;

interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  id: string;
  label: string;
  error?: string;
}

export function FormField({
  error,
  id,
  label,
  ...inputProps
}: FormFieldProps) {
  const errorId = `${id}-error`;

  return (
    <Field>
      <Label htmlFor={id}>{label}</Label>
      <Input
        {...inputProps}
        id={id}
        $hasError={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        aria-invalid={Boolean(error)}
      />
      {error ? <ErrorText id={errorId}>{error}</ErrorText> : null}
    </Field>
  );
}
