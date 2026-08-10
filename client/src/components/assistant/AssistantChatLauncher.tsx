import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { useLocation } from "react-router-dom";
import styled, { keyframes } from "styled-components";
import { AssistantChatPanel } from "./AssistantChatPanel";
import { AssistantSessionSidebar } from "./AssistantSessionSidebar";
import { AppIcon } from "../common/AppIcon";
import { Button } from "../common/Button";
import { useAssistantChat } from "../../context/AssistantChatProvider";

const FAB_SIZE = 56;
const FAB_MARGIN = 16;
const DRAG_THRESHOLD = 6;
const DIALOG_GAP = 12;
const DIALOG_WIDTH = 420;
const DIALOG_HEIGHT = 640;

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const slideUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(8px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
`;

const Fab = styled.button<{ $dragging: boolean }>`
  position: fixed;
  z-index: 80;
  display: grid;
  width: ${FAB_SIZE}px;
  height: ${FAB_SIZE}px;
  place-items: center;
  border: 0;
  border-radius: 999px;
  background: linear-gradient(145deg, var(--color-primary-500), var(--color-primary-700));
  color: #ffffff;
  box-shadow: 0 10px 28px rgb(92 61 34 / 28%);
  cursor: ${({ $dragging }) => ($dragging ? "grabbing" : "grab")};
  touch-action: none;
  user-select: none;
  transition: ${({ $dragging }) =>
    $dragging
      ? "none"
      : "left 180ms ease, top 180ms ease, box-shadow 160ms ease"};

  &:hover {
    box-shadow: ${({ $dragging }) =>
      $dragging
        ? "0 10px 28px rgb(92 61 34 / 28%)"
        : "0 14px 32px rgb(92 61 34 / 34%)"};
  }

  &:focus-visible {
    outline: none;
    box-shadow: var(--focus-ring), 0 10px 28px rgb(92 61 34 / 28%);
  }
`;

const Backdrop = styled.div`
  position: fixed;
  z-index: 90;
  inset: 0;
  background: rgb(16 24 40 / 42%);
  animation: ${fadeIn} 160ms ease;
`;

const Dialog = styled.div`
  position: fixed;
  z-index: 95;
  display: flex;
  width: min(${DIALOG_WIDTH}px, calc(100vw - 1.5rem));
  height: min(${DIALOG_HEIGHT}px, calc(100vh - 7rem));
  flex-direction: column;
  overflow: hidden;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  background: var(--color-surface);
  box-shadow: var(--shadow-md);
  animation: ${slideUp} 180ms ease;

  @media (max-width: 520px) {
    height: min(72vh, calc(100vh - 6.5rem));
  }
`;

const Header = styled.div`
  display: flex;
  flex: 0 0 auto;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-3);
  padding: var(--space-4) var(--space-4) var(--space-3);
  border-bottom: 1px solid var(--color-border);
  background: var(--color-surface-subtle);
`;

const HeaderCopy = styled.div`
  display: grid;
  gap: 0.2rem;

  h2 {
    margin: 0;
    font-size: var(--font-size-md);
    font-weight: 750;
  }

  p {
    margin: 0;
    color: var(--color-text-muted);
    font-size: var(--font-size-xs);
  }
`;

const HeaderActions = styled.div`
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  gap: var(--space-2);
`;

const CloseButton = styled.button`
  display: grid;
  width: 2rem;
  height: 2rem;
  flex: 0 0 auto;
  place-items: center;
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  color: var(--color-text-muted);
  font-size: 1.15rem;
  line-height: 1;
  cursor: pointer;

  &:hover {
    color: var(--color-text);
    background: var(--color-surface-subtle);
  }
`;

const HistoryPanel = styled.div`
  flex: 0 0 auto;
  max-height: 180px;
  overflow: auto;
  padding: var(--space-3);
  border-bottom: 1px solid var(--color-border);
  background: var(--color-surface-subtle);
`;

const PanelFrame = styled.div`
  min-height: 0;
  flex: 1;
`;

interface Position {
  x: number;
  y: number;
}

const getDefaultFabPosition = (): Position => ({
  x: Math.max(FAB_MARGIN, window.innerWidth - FAB_SIZE - FAB_MARGIN),
  y: Math.max(FAB_MARGIN, window.innerHeight - FAB_SIZE - FAB_MARGIN),
});

const clampFabPosition = (position: Position): Position => {
  const maxX = Math.max(FAB_MARGIN, window.innerWidth - FAB_SIZE - FAB_MARGIN);
  const maxY = Math.max(FAB_MARGIN, window.innerHeight - FAB_SIZE - FAB_MARGIN);

  return {
    x: Math.min(Math.max(FAB_MARGIN, position.x), maxX),
    y: Math.min(Math.max(FAB_MARGIN, position.y), maxY),
  };
};

/** Keep vertical freedom, but dock horizontally to the nearest screen edge. */
const snapFabToSide = (position: Position): Position => {
  const clamped = clampFabPosition(position);
  const leftX = FAB_MARGIN;
  const rightX = Math.max(FAB_MARGIN, window.innerWidth - FAB_SIZE - FAB_MARGIN);
  const fabCenterX = clamped.x + FAB_SIZE / 2;
  const screenCenterX = window.innerWidth / 2;

  return {
    x: fabCenterX < screenCenterX ? leftX : rightX,
    y: clamped.y,
  };
};

const getDialogPosition = (fab: Position) => {
  const dialogWidth = Math.min(DIALOG_WIDTH, window.innerWidth - FAB_MARGIN * 2);
  const dialogHeight = Math.min(
    DIALOG_HEIGHT,
    window.innerHeight - FAB_MARGIN * 2 - FAB_SIZE - DIALOG_GAP,
  );

  let left = fab.x + FAB_SIZE - dialogWidth;
  let top = fab.y - dialogHeight - DIALOG_GAP;

  if (top < FAB_MARGIN) {
    top = fab.y + FAB_SIZE + DIALOG_GAP;
  }

  left = Math.min(
    Math.max(FAB_MARGIN, left),
    Math.max(FAB_MARGIN, window.innerWidth - dialogWidth - FAB_MARGIN),
  );
  top = Math.min(
    Math.max(FAB_MARGIN, top),
    Math.max(FAB_MARGIN, window.innerHeight - dialogHeight - FAB_MARGIN),
  );

  return { left, top, width: dialogWidth, height: dialogHeight };
};

const getSuggestionsForPath = (pathname: string): string[] => {
  if (pathname.startsWith("/dashboard/plans")) {
    return [
      "What plans do I have for this month?",
      "Which categories still need a plan?",
      "Compare my plan and actuals for this month",
    ];
  }

  if (pathname.startsWith("/dashboard/actuals")) {
    return [
      "List actual entries for this month",
      "Record 250 in Tools for this month",
      "Which category spent the most this month?",
    ];
  }

  if (pathname.startsWith("/dashboard/report")) {
    return [
      "Compare my plan and actuals for this month",
      "Show my biggest overspending category this year",
      "Summarize variance for the last three months",
    ];
  }

  if (pathname.startsWith("/dashboard/period-locks")) {
    return [
      "Which months are locked?",
      "Compare my plan and actuals for this month",
      "List actual entries for the last three months",
    ];
  }

  if (pathname.startsWith("/dashboard/categories")) {
    return [
      "Create a category called Travel",
      "Which categories are over plan this month?",
      "Show spending by category this year",
    ];
  }

  return [
    "Create a category called Travel",
    "Compare my plan and actuals for this month",
    "Show my biggest overspending category this year",
    "List actual entries for the last three months",
    "Record 250 in Tools for this month",
  ];
};

const getSectionLabel = (pathname: string) => {
  if (pathname.startsWith("/dashboard/plans")) return "Plans";
  if (pathname.startsWith("/dashboard/actuals")) return "Actuals";
  if (pathname.startsWith("/dashboard/report")) return "Report";
  if (pathname.startsWith("/dashboard/period-locks")) return "Period locks";
  if (pathname.startsWith("/dashboard/categories")) return "Categories";
  return "Overview";
};

export function AssistantChatLauncher() {
  const location = useLocation();
  const { startNewChat } = useAssistantChat();
  const [isOpen, setIsOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [position, setPosition] = useState<Position>(() => getDefaultFabPosition());
  const [isDragging, setIsDragging] = useState(false);

  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
    moved: boolean;
  } | null>(null);
  const suppressClickRef = useRef(false);

  const suggestions = useMemo(
    () => getSuggestionsForPath(location.pathname),
    [location.pathname],
  );
  const sectionLabel = getSectionLabel(location.pathname);
  const dialogPosition = useMemo(() => getDialogPosition(position), [position]);

  const snapToSide = useCallback(() => {
    setPosition((current) => snapFabToSide(current));
  }, []);

  useEffect(() => {
    snapToSide();
    window.addEventListener("resize", snapToSide);
    return () => window.removeEventListener("resize", snapToSide);
  }, [snapToSide]);

  useEffect(() => {
    if (location.pathname.startsWith("/dashboard/assistant")) {
      setIsOpen(false);
      setShowHistory(false);
    }
  }, [location.pathname]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const handlePointerDown = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (event.button !== 0) return;

    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: position.x,
      originY: position.y,
      moved: false,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;

    const deltaX = event.clientX - drag.startX;
    const deltaY = event.clientY - drag.startY;

    if (
      !drag.moved &&
      Math.abs(deltaX) < DRAG_THRESHOLD &&
      Math.abs(deltaY) < DRAG_THRESHOLD
    ) {
      return;
    }

    drag.moved = true;
    setIsDragging(true);
    setPosition(
      clampFabPosition({
        x: drag.originX + deltaX,
        y: drag.originY + deltaY,
      }),
    );
  };

  const endDrag = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;

    if (drag.moved) {
      suppressClickRef.current = true;
      setPosition((current) => snapFabToSide(current));
    }

    dragRef.current = null;
    setIsDragging(false);

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const handleClick = () => {
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      return;
    }

    setIsOpen((current) => {
      const next = !current;
      if (next) {
        startNewChat();
        setShowHistory(false);
      }
      return next;
    });
  };

  return (
    <>
      {location.pathname.startsWith("/dashboard/assistant") ? null : (
        <Fab
          type="button"
          $dragging={isDragging}
          style={{ left: position.x, top: position.y }}
          aria-label={isOpen ? "Close assistant chat" : "Open assistant chat"}
          aria-expanded={isOpen}
          title="Drag to move · docks to left or right edge"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onClick={handleClick}
        >
          <AppIcon name="assistant" size={22} />
        </Fab>
      )}

      {isOpen && !location.pathname.startsWith("/dashboard/assistant") ? (
        <>
          <Backdrop onMouseDown={() => setIsOpen(false)} />
          <Dialog
            role="dialog"
            aria-modal="true"
            aria-labelledby="assistant-chat-title"
            style={{
              left: dialogPosition.left,
              top: dialogPosition.top,
              width: dialogPosition.width,
              height: dialogPosition.height,
            }}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <Header>
              <HeaderCopy>
                <h2 id="assistant-chat-title">Ask your data</h2>
                <p>Context: {sectionLabel}</p>
              </HeaderCopy>
              <HeaderActions>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    startNewChat();
                    setShowHistory(false);
                  }}
                >
                  New
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowHistory((value) => !value)}
                >
                  {showHistory ? "Hide" : "History"}
                </Button>
                <CloseButton
                  type="button"
                  aria-label="Close chat"
                  onClick={() => setIsOpen(false)}
                >
                  ×
                </CloseButton>
              </HeaderActions>
            </Header>
            {showHistory ? (
              <HistoryPanel>
                <AssistantSessionSidebar compact />
              </HistoryPanel>
            ) : null}
            <PanelFrame>
              <AssistantChatPanel compact suggestions={suggestions} />
            </PanelFrame>
          </Dialog>
        </>
      ) : null}
    </>
  );
}
