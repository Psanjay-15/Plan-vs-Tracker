import { useEffect, useState, type PropsWithChildren } from "react";
import { useLocation } from "react-router-dom";
import styled, { keyframes } from "styled-components";

const fadeUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const Stage = styled.div<{ $animate: boolean }>`
  display: flex;
  width: 100%;
  min-height: 0;
  flex: 1 1 auto;
  flex-direction: column;
  animation: ${({ $animate }) => ($animate ? fadeUp : "none")} 220ms ease;

  > * {
    min-height: 0;
    flex: 1 1 auto;
  }
`;

export function PageTransition({ children }: PropsWithChildren) {
  const location = useLocation();
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    setAnimate(false);
    const frame = window.requestAnimationFrame(() => setAnimate(true));
    return () => window.cancelAnimationFrame(frame);
  }, [location.pathname]);

  return (
    <Stage key={location.pathname} $animate={animate}>
      {children}
    </Stage>
  );
}
