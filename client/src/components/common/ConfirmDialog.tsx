import { useEffect } from "react";
import styled from "styled-components";
import { Button } from "./Button";

const Backdrop = styled.div`
  position: fixed;
  z-index: 100;
  inset: 0;
  display: grid;
  place-items: center;
  padding: var(--space-4);
  background: rgb(16 24 40 / 55%);
`;

const Dialog = styled.div`
  width: min(100%, 440px);
  padding: var(--space-6);
  border-radius: var(--radius-xl);
  background: var(--color-surface);
  box-shadow: var(--shadow-md);

  h2 {
    margin-bottom: var(--space-3);
    font-size: var(--font-size-xl);
  }

  p {
    margin-bottom: var(--space-6);
    color: var(--color-text-muted);
  }
`;

const Actions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: var(--space-3);
`;

interface ConfirmDialogProps {
  confirmLabel?: string;
  confirmingLabel?: string;
  description: string;
  isConfirming?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  title: string;
}

export function ConfirmDialog({
  confirmLabel = "Confirm",
  confirmingLabel = "Deleting...",
  description,
  isConfirming = false,
  onCancel,
  onConfirm,
  title,
}: ConfirmDialogProps) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isConfirming) onCancel();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isConfirming, onCancel]);

  return (
    <Backdrop onMouseDown={isConfirming ? undefined : onCancel}>
      <Dialog
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirmation-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <h2 id="confirmation-title">{title}</h2>
        <p>{description}</p>
        <Actions>
          <Button
            variant="secondary"
            onClick={onCancel}
            disabled={isConfirming}
          >
            Cancel
          </Button>
          <Button variant="danger" onClick={onConfirm} disabled={isConfirming}>
            {isConfirming ? confirmingLabel : confirmLabel}
          </Button>
        </Actions>
      </Dialog>
    </Backdrop>
  );
}
