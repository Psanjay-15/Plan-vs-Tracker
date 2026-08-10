import { useState } from "react";
import { Link } from "react-router-dom";
import styled from "styled-components";
import { AppIcon } from "../components/common/AppIcon";
import { Button } from "../components/common/Button";
import { useAuth } from "../hooks/useAuth";

const Landing = styled.main`
  position: relative;
  display: grid;
  width: 100%;
  height: 100svh;
  min-height: 560px;
  overflow: hidden;
  grid-template-rows: auto minmax(0, 1fr) auto;
  padding: clamp(1rem, 2.5vw, 2rem) clamp(1rem, 5vw, 4.5rem);
  background:
    radial-gradient(circle at 86% 14%, rgb(214 106 58 / 13%), transparent 28%),
    radial-gradient(circle at 5% 92%, rgb(77 124 87 / 9%), transparent 24%),
    var(--color-background);

  @media (max-width: 720px) {
    min-height: 500px;
  }
`;

const Header = styled.header`
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
`;

const Brand = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: var(--space-3);
  color: var(--color-text);
  font-size: var(--font-size-lg);
  font-weight: 760;
  text-decoration: none;
`;

const BrandMark = styled.span`
  display: grid;
  width: 2.5rem;
  height: 2.5rem;
  flex: 0 0 auto;
  place-items: center;
  border-radius: var(--radius-lg);
  background: linear-gradient(145deg, var(--color-primary-500), var(--color-primary-700));
  color: #fff;
  box-shadow: 0 8px 24px rgb(185 79 39 / 22%);
`;

const HeaderAction = styled(Link)`
  display: inline-flex;
  min-height: 2.5rem;
  align-items: center;
  padding: 0.55rem 1rem;
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-full);
  background: rgb(255 253 249 / 72%);
  color: var(--color-text);
  font-size: var(--font-size-sm);
  font-weight: 650;
  text-decoration: none;
  backdrop-filter: blur(10px);

  &:hover {
    border-color: var(--color-primary-500);
    color: var(--color-primary-700);
  }
`;

const Hero = styled.section`
  position: relative;
  z-index: 1;
  display: grid;
  min-height: 0;
  grid-template-columns: minmax(0, 1.05fr) minmax(390px, 0.95fr);
  align-items: center;
  gap: clamp(2rem, 6vw, 6rem);
  width: min(100%, 1240px);
  margin-inline: auto;

  @media (max-width: 900px) {
    grid-template-columns: minmax(0, 1fr) minmax(280px, 0.72fr);
    gap: var(--space-8);
  }

  @media (max-width: 720px) {
    grid-template-columns: 1fr;
  }
`;

const HeroCopy = styled.div`
  max-width: 670px;
`;

const Eyebrow = styled.div`
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  margin-bottom: clamp(0.75rem, 2vh, 1.25rem);
  color: var(--color-primary-700);
  font-size: var(--font-size-xs);
  font-weight: 750;
  letter-spacing: 0.1em;
  text-transform: uppercase;

  &::before {
    width: 1.6rem;
    height: 2px;
    background: var(--color-primary-500);
    content: "";
  }
`;

const Title = styled.h1`
  max-width: 700px;
  margin-bottom: clamp(0.9rem, 2vh, 1.4rem);
  color: var(--color-text);
  font-size: clamp(2.65rem, 5.1vw, 5.1rem);
  line-height: 0.98;
  letter-spacing: -0.06em;

  span {
    color: var(--color-primary-600);
  }

  @media (max-width: 720px) {
    font-size: clamp(2.45rem, 12vw, 4rem);
  }
`;

const Description = styled.p`
  max-width: 580px;
  margin-bottom: clamp(1.25rem, 3vh, 2rem);
  color: var(--color-text-muted);
  font-size: clamp(1rem, 1.5vw, 1.2rem);
  line-height: 1.6;
`;

const Actions = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-3);
`;

const ActionLink = styled(Link)<{ $primary?: boolean }>`
  display: inline-flex;
  min-height: 3rem;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  padding: 0.75rem 1.25rem;
  border: 1px solid
    ${({ $primary }) => $primary ? "var(--color-primary-600)" : "var(--color-border-strong)"};
  border-radius: var(--radius-md);
  background: ${({ $primary }) => $primary ? "var(--color-primary-600)" : "var(--color-surface)"};
  color: ${({ $primary }) => $primary ? "#fff" : "var(--color-text)"};
  box-shadow: ${({ $primary }) => $primary ? "0 10px 26px rgb(185 79 39 / 20%)" : "var(--shadow-sm)"};
  font-weight: 680;
  text-decoration: none;
  transition: transform 150ms ease, box-shadow 150ms ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
  }
`;

const SessionText = styled.span`
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
`;

const Preview = styled.div`
  position: relative;
  width: 100%;
  max-width: 530px;
  justify-self: end;
  padding: clamp(1rem, 2vw, 1.4rem);
  border: 1px solid rgb(215 201 187 / 85%);
  border-radius: 1.35rem;
  background: rgb(255 253 249 / 86%);
  box-shadow: 0 30px 70px rgb(72 49 36 / 15%);
  backdrop-filter: blur(14px);

  &::before {
    position: absolute;
    inset: -18px auto auto -18px;
    z-index: -1;
    width: 88px;
    height: 88px;
    border-radius: 1.5rem;
    background: var(--color-primary-100);
    content: "";
    transform: rotate(12deg);
  }

  @media (max-width: 720px) {
    display: none;
  }
`;

const PreviewTop = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-5);

  strong {
    font-size: var(--font-size-lg);
  }
`;

const MonthBadge = styled.span`
  padding: 0.35rem 0.65rem;
  border-radius: var(--radius-full);
  background: var(--color-surface-subtle);
  color: var(--color-text-muted);
  font-size: var(--font-size-xs);
  font-weight: 650;
`;

const StatGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-3);
`;

const Stat = styled.div<{ $accent?: boolean }>`
  padding: var(--space-4);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: ${({ $accent }) => $accent ? "var(--color-primary-50)" : "var(--color-surface)"};

  span {
    display: block;
    margin-bottom: var(--space-2);
    color: var(--color-text-muted);
    font-size: var(--font-size-xs);
    font-weight: 650;
  }

  strong {
    font-size: clamp(1.15rem, 2vw, 1.5rem);
    font-variant-numeric: tabular-nums;
  }
`;

const ProgressPanel = styled.div`
  margin-top: var(--space-3);
  padding: var(--space-4);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
`;

const ProgressHeader = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: var(--space-3);

  span {
    color: var(--color-text-muted);
    font-size: var(--font-size-xs);
  }
`;

const ProgressTrack = styled.div`
  height: 0.55rem;
  overflow: hidden;
  border-radius: var(--radius-full);
  background: var(--color-border);

  &::after {
    display: block;
    width: 68%;
    height: 100%;
    border-radius: inherit;
    background: linear-gradient(90deg, var(--color-primary-500), var(--color-primary-700));
    content: "";
  }
`;

const FeatureStrip = styled.footer`
  position: relative;
  z-index: 2;
  display: grid;
  width: min(100%, 1240px);
  margin-inline: auto;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  border-top: 1px solid var(--color-border);
`;

const Feature = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: clamp(0.8rem, 2vh, 1.15rem) var(--space-4);
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);

  &:not(:last-child) {
    border-right: 1px solid var(--color-border);
  }

  strong {
    display: block;
    color: var(--color-text);
    font-size: var(--font-size-sm);
  }

  @media (max-width: 620px) {
    justify-content: center;
    padding-inline: var(--space-2);

    div {
      display: none;
    }
  }
`;

const FeatureIcon = styled.span`
  display: grid;
  width: 2rem;
  height: 2rem;
  flex: 0 0 auto;
  place-items: center;
  border-radius: var(--radius-md);
  background: var(--color-primary-50);
  color: var(--color-primary-700);
`;

export function WelcomePage() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <Landing>
      <Header>
        <Brand to="/">
          <BrandMark><AppIcon name="brand" size={21} /></BrandMark>
          Plan vs Actual
        </Brand>
        {!isLoading && !isAuthenticated ? <HeaderAction to="/login">Sign in</HeaderAction> : null}
      </Header>

      <Hero>
        <HeroCopy>
          <Eyebrow>Financial planning, simplified</Eyebrow>
          <Title>Know where the plan <span>meets reality.</span></Title>
          <Description>
            Set monthly targets, record actual spending, and understand every
            variance from one calm, focused workspace.
          </Description>

          {!isLoading ? (
            <Actions>
              {isAuthenticated ? (
                <>
                  <ActionLink to="/dashboard" $primary>
                    Open dashboard <span aria-hidden="true">→</span>
                  </ActionLink>
                  <Button
                    variant="secondary"
                    disabled={isLoggingOut}
                    onClick={() => void handleLogout()}
                  >
                    {isLoggingOut ? "Signing out..." : "Sign out"}
                  </Button>
                  <SessionText>Signed in as {user?.name}</SessionText>
                </>
              ) : (
                <>
                  <ActionLink to="/signup" $primary>
                    Start planning <span aria-hidden="true">→</span>
                  </ActionLink>
                  <ActionLink to="/login">I have an account</ActionLink>
                </>
              )}
            </Actions>
          ) : <SessionText>Preparing your workspace...</SessionText>}
        </HeroCopy>

        <Preview aria-label="Plan versus actual dashboard preview">
          <PreviewTop>
            <strong>Monthly overview</strong>
            <MonthBadge>August 2026</MonthBadge>
          </PreviewTop>
          <StatGrid>
            <Stat>
              <span>Planned</span>
              <strong>₹84,000</strong>
            </Stat>
            <Stat $accent>
              <span>Actual spent</span>
              <strong>₹57,120</strong>
            </Stat>
          </StatGrid>
          <ProgressPanel>
            <ProgressHeader>
              <strong>68% used</strong>
              <span>₹26,880 remaining</span>
            </ProgressHeader>
            <ProgressTrack />
          </ProgressPanel>
        </Preview>
      </Hero>

      <FeatureStrip>
        <Feature>
          <FeatureIcon><AppIcon name="target" size={16} /></FeatureIcon>
          <div><strong>Plan monthly</strong>Set category targets</div>
        </Feature>
        <Feature>
          <FeatureIcon><AppIcon name="variance" size={16} /></FeatureIcon>
          <div><strong>See variances</strong>Compare in real time</div>
        </Feature>
        <Feature>
          <FeatureIcon><AppIcon name="lock" size={16} /></FeatureIcon>
          <div><strong>Close confidently</strong>Lock finished periods</div>
        </Feature>
      </FeatureStrip>
    </Landing>
  );
}
