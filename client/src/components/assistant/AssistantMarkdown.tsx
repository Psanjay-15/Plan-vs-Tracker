import { Fragment, type ReactNode } from "react";
import styled from "styled-components";

const Content = styled.div`
  display: grid;
  gap: 0.65rem;
  line-height: 1.55;
  white-space: normal;

  p {
    margin: 0;
  }

  h3 {
    margin: 0.15rem 0 0;
    font-size: var(--font-size-md);
    font-weight: 700;
    line-height: 1.35;
  }

  ul {
    display: grid;
    gap: 0.35rem;
    margin: 0;
    padding-left: 1.15rem;
  }

  li {
    margin: 0;
  }

  strong {
    font-weight: 700;
  }
`;

const renderInline = (text: string): ReactNode[] => {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);

  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }

    return <Fragment key={index}>{part}</Fragment>;
  });
};

const isHeading = (line: string) => /^#{1,3}\s+/.test(line);
const isBullet = (line: string) => /^[-*]\s+/.test(line);

const headingText = (line: string) => line.replace(/^#{1,3}\s+/, "");
const bulletText = (line: string) => line.replace(/^[-*]\s+/, "");

export function AssistantMarkdown({ content }: { content: string }) {
  const lines = content.replace(/\r\n/g, "\n").split("\n");
  const blocks: ReactNode[] = [];
  let paragraph: string[] = [];
  let listItems: string[] = [];
  let key = 0;

  const flushParagraph = () => {
    if (paragraph.length === 0) return;
    blocks.push(<p key={`p-${key++}`}>{renderInline(paragraph.join(" "))}</p>);
    paragraph = [];
  };

  const flushList = () => {
    if (listItems.length === 0) return;
    blocks.push(
      <ul key={`ul-${key++}`}>
        {listItems.map((item, index) => (
          <li key={index}>{renderInline(item)}</li>
        ))}
      </ul>,
    );
    listItems = [];
  };

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();
    const trimmed = line.trim();

    if (!trimmed) {
      flushParagraph();
      flushList();
      continue;
    }

    if (isHeading(trimmed)) {
      flushParagraph();
      flushList();
      blocks.push(<h3 key={`h-${key++}`}>{renderInline(headingText(trimmed))}</h3>);
      continue;
    }

    if (isBullet(trimmed)) {
      flushParagraph();
      listItems.push(bulletText(trimmed));
      continue;
    }

    flushList();
    paragraph.push(trimmed);
  }

  flushParagraph();
  flushList();

  return <Content>{blocks}</Content>;
}
