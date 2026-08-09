import type { PropsWithChildren, ReactNode } from "react";
import { Link } from "react-router-dom";
import styled from "styled-components";
import { AppIcon } from "../common/AppIcon";

const Page = styled.main`
  display: grid;
  min-height: 100vh;
  place-items: center;
  padding: var(--space-6);
  background:
    radial-gradient(circle at 10% 15%, rgb(214 106 58 / 14%), transparent 32rem),
    var(--color-background);

  @media (max-width: 640px) {
    padding: var(--space-3);
  }
`;

const Shell = styled.section`
  display: grid;
  width: min(100%, 960px);
  min-height: 610px;
  grid-template-columns: minmax(300px, 0.85fr) minmax(380px, 1.15fr);
  overflow: hidden;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  background: var(--color-surface);
  box-shadow: var(--shadow-md);

  @media (max-width: 800px) {
    min-height: auto;
    grid-template-columns: 1fr;
  }
`;

const BrandPanel = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: var(--space-10);
  background:
    linear-gradient(155deg, rgb(255 255 255 / 8%), transparent 40%),
    #3a2921;
  color: #ffffff;

  @media (max-width: 800px) {
    gap: var(--space-6);
    padding: var(--space-6);
  }
`;

const BrandLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: var(--space-3);
  width: fit-content;
  color: #ffffff;
  font-weight: 750;
  text-decoration: none;
`;

const BrandMark = styled.span`
  display: grid;
  width: 2.25rem;
  height: 2.25rem;
  place-items: center;
  border-radius: var(--radius-md);
  background: var(--color-primary-500);
  font-size: var(--font-size-lg);
`;

const BrandCopy = styled.div`
  h2 {
    max-width: 300px;
    margin-bottom: var(--space-4);
    font-size: var(--font-size-2xl);
    line-height: var(--line-height-tight);
  }

  p {
    max-width: 320px;
    margin: 0;
    color: #e6d9cf;
    font-size: var(--font-size-sm);
  }

  @media (max-width: 800px) {
    h2,
    p {
      max-width: none;
    }
  }
`;

const FormPanel = styled.div`
  display: flex;
  align-items: center;
  padding: var(--space-10) clamp(2rem, 6vw, 4.5rem);

  @media (max-width: 640px) {
    padding: var(--space-8) var(--space-5);
  }
`;

const FormContent = styled.div`
  width: 100%;
  max-width: 410px;
  margin-inline: auto;
`;

const Heading = styled.h1`
  margin-bottom: var(--space-2);
  font-size: var(--font-size-3xl);
  line-height: var(--line-height-tight);
  letter-spacing: -0.035em;
`;

const Subtitle = styled.p`
  margin-bottom: var(--space-8);
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
`;

const Footer = styled.div`
  margin-top: var(--space-6);
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
  text-align: center;

  a {
    font-weight: 650;
    text-decoration: none;
  }

  a:hover {
    text-decoration: underline;
  }
`;

interface AuthLayoutProps extends PropsWithChildren {
  footer: ReactNode;
  subtitle: string;
  title: string;
}

export function AuthLayout({
  children,
  footer,
  subtitle,
  title,
}: AuthLayoutProps) {
  return (
    <Page>
      <Shell>
        <BrandPanel>
          <BrandLink to="/">
            <BrandMark><AppIcon name="brand" size={20} /></BrandMark>
            Plan vs Actual
          </BrandLink>

          <BrandCopy>
            <h2>Financial clarity starts with a reliable plan.</h2>
            <p>
              Track monthly targets, understand spending, and close periods
              with confidence.
            </p>
          </BrandCopy>
        </BrandPanel>

        <FormPanel>
          <FormContent>
            <Heading>{title}</Heading>
            <Subtitle>{subtitle}</Subtitle>
            {children}
            <Footer>{footer}</Footer>
          </FormContent>
        </FormPanel>
      </Shell>
    </Page>
  );
}
