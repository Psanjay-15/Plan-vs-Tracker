import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";
import { createPortal } from "react-dom";
import styled, { keyframes } from "styled-components";

type ToastTone = "success" | "error" | "info";

interface ToastItem {
  id: string;
  message: string;
  tone: ToastTone;
}

interface ToastContextValue {
  pushToast: (message: string, tone?: ToastTone) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const slideIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const Viewport = styled.div`
  position: fixed;
  z-index: 120;
  right: 1.25rem;
  bottom: 1.25rem;
  display: grid;
  gap: 0.65rem;
  width: min(360px, calc(100vw - 2rem));
  pointer-events: none;
`;

const ToastCard = styled.div<{ $tone: ToastTone }>`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.85rem 0.95rem;
  border: 1px solid
    ${({ $tone }) =>
      $tone === "success"
        ? "rgb(18 116 74 / 24%)"
        : $tone === "error"
          ? "rgb(217 45 32 / 28%)"
          : "var(--color-border-strong)"};
  border-radius: var(--radius-lg);
  background: ${({ $tone }) =>
    $tone === "success"
      ? "#edf8f1"
      : $tone === "error"
        ? "var(--color-danger-50)"
        : "var(--color-surface)"};
  color: ${({ $tone }) =>
    $tone === "success"
      ? "#0f6a42"
      : $tone === "error"
        ? "var(--color-danger-600)"
        : "var(--color-text)"};
  box-shadow: var(--shadow-md);
  pointer-events: auto;
  animation: ${slideIn} 180ms ease;
`;

const ToastMessage = styled.p`
  margin: 0;
  font-size: var(--font-size-sm);
  font-weight: 600;
  line-height: 1.4;
`;

const DismissButton = styled.button`
  flex: 0 0 auto;
  padding: 0;
  border: 0;
  background: transparent;
  color: inherit;
  font-size: 1.1rem;
  line-height: 1;
  cursor: pointer;
  opacity: 0.7;

  &:hover {
    opacity: 1;
  }
`;

export function ToastProvider({ children }: PropsWithChildren) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const pushToast = useCallback(
    (message: string, tone: ToastTone = "info") => {
      const id = crypto.randomUUID();
      setToasts((current) => [...current, { id, message, tone }].slice(-4));
      window.setTimeout(() => dismiss(id), 3200);
    },
    [dismiss],
  );

  const value = useMemo<ToastContextValue>(
    () => ({
      pushToast,
      success: (message) => pushToast(message, "success"),
      error: (message) => pushToast(message, "error"),
      info: (message) => pushToast(message, "info"),
    }),
    [pushToast],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      {createPortal(
        <Viewport aria-live="polite" aria-relevant="additions">
          {toasts.map((toast) => (
            <ToastCard key={toast.id} $tone={toast.tone} role="status">
              <ToastMessage>{toast.message}</ToastMessage>
              <DismissButton
                type="button"
                aria-label="Dismiss notification"
                onClick={() => dismiss(toast.id)}
              >
                ×
              </DismissButton>
            </ToastCard>
          ))}
        </Viewport>,
        document.body,
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
}
