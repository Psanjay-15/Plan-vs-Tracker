import type { ButtonHTMLAttributes, PropsWithChildren } from "react";
import styled from "styled-components";

type ButtonVariant = "primary" | "secondary";

interface StyledButtonProps {
  $fullWidth: boolean;
  $variant: ButtonVariant;
}

const StyledButton = styled.button<StyledButtonProps>`
  display: inline-flex;
  width: ${({ $fullWidth }) => ($fullWidth ? "100%" : "auto")};
  min-height: 2.75rem;
  align-items: center;
  justify-content: center;
  padding: 0.7rem 1.1rem;
  border: 1px solid
    ${({ $variant }) =>
      $variant === "primary"
        ? "var(--color-primary-600)"
        : "var(--color-border-strong)"};
  border-radius: var(--radius-md);
  background: ${({ $variant }) =>
    $variant === "primary"
      ? "var(--color-primary-600)"
      : "var(--color-surface)"};
  color: ${({ $variant }) =>
    $variant === "primary" ? "#ffffff" : "var(--color-text)"};
  font-weight: 650;
  line-height: 1;
  cursor: pointer;
  transition:
    background 150ms ease,
    border-color 150ms ease,
    box-shadow 150ms ease,
    transform 150ms ease;

  &:hover:not(:disabled) {
    border-color: ${({ $variant }) =>
      $variant === "primary"
        ? "var(--color-primary-700)"
        : "var(--color-primary-500)"};
    background: ${({ $variant }) =>
      $variant === "primary"
        ? "var(--color-primary-700)"
        : "var(--color-primary-50)"};
  }

  &:active:not(:disabled) {
    transform: translateY(1px);
  }

  &:focus-visible {
    outline: none;
    box-shadow: var(--focus-ring);
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.62;
  }
`;

interface ButtonProps
  extends PropsWithChildren,
    ButtonHTMLAttributes<HTMLButtonElement> {
  fullWidth?: boolean;
  variant?: ButtonVariant;
}

export function Button({
  children,
  fullWidth = false,
  type = "button",
  variant = "primary",
  ...props
}: ButtonProps) {
  return (
    <StyledButton
      $fullWidth={fullWidth}
      $variant={variant}
      type={type}
      {...props}
    >
      {children}
    </StyledButton>
  );
}
