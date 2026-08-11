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

const TableWrap = styled.div`
  width: 100%;
  overflow-x: auto;
  border: 1px solid color-mix(in srgb, var(--color-border) 85%, transparent);
  border-radius: 10px;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 0.92em;
  white-space: nowrap;

  th,
  td {
    padding: 0.55rem 0.75rem;
    text-align: left;
    border-bottom: 1px solid
      color-mix(in srgb, var(--color-border) 80%, transparent);
    vertical-align: top;
    white-space: normal;
  }

  th {
    font-weight: 700;
    background: color-mix(in srgb, var(--color-surface-muted, #f4f4f5) 88%, white);
  }

  tr:last-child td {
    border-bottom: none;
  }

  td:nth-child(n + 2),
  th:nth-child(n + 2) {
    text-align: right;
    font-variant-numeric: tabular-nums;
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
const isSeparatorRow = (line: string) =>
  /^\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)+\|?$/.test(line.trim());
const isTableRow = (line: string) => {
  const trimmed = line.trim();
  return trimmed.startsWith("|") && trimmed.includes("|", 1);
};

const headingText = (line: string) => line.replace(/^#{1,3}\s+/, "");
const bulletText = (line: string) => line.replace(/^[-*]\s+/, "");

const parseCells = (row: string) =>
  row
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim());

/** Pull GFM table rows even when the model collapses them onto one line. */
const extractTableRows = (text: string): string[] | null => {
  const matches = text.match(/\|(?:[^|\n]*\|)+/g);
  if (!matches || matches.length < 2) return null;

  const hasSeparator = matches.some((row) => isSeparatorRow(row));
  if (!hasSeparator) return null;

  return matches;
};

const looksLikeCollapsedTable = (text: string) =>
  Boolean(extractTableRows(text));

type ParsedTable = {
  headers: string[];
  rows: string[][];
};

const parseMarkdownTable = (rowLines: string[]): ParsedTable | null => {
  const rows = rowLines.map(parseCells).filter((cells) => cells.length > 0);
  if (rows.length < 2) return null;

  const separatorIndex = rowLines.findIndex((row) => isSeparatorRow(row));
  if (separatorIndex <= 0) return null;

  const headers = rows[separatorIndex - 1] ?? rows[0];
  const body = rows.slice(separatorIndex + 1).filter((_, index) => {
    const source = rowLines[separatorIndex + 1 + index];
    return source ? !isSeparatorRow(source) : true;
  });

  if (headers.length === 0 || body.length === 0) return null;

  const columnCount = headers.length;
  return {
    headers,
    rows: body.map((row) => {
      const next = [...row];
      while (next.length < columnCount) next.push("");
      return next.slice(0, columnCount);
    }),
  };
};

const renderTable = (table: ParsedTable, key: number) => (
  <TableWrap key={`table-${key}`}>
    <Table>
      <thead>
        <tr>
          {table.headers.map((header, index) => (
            <th key={index}>{renderInline(header)}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {table.rows.map((row, rowIndex) => (
          <tr key={rowIndex}>
            {row.map((cell, cellIndex) => (
              <td key={cellIndex}>{renderInline(cell)}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </Table>
  </TableWrap>
);

export function AssistantMarkdown({ content }: { content: string }) {
  const lines = content.replace(/\r\n/g, "\n").split("\n");
  const blocks: ReactNode[] = [];
  let paragraph: string[] = [];
  let listItems: string[] = [];
  let tableLines: string[] = [];
  let key = 0;

  const flushParagraph = () => {
    if (paragraph.length === 0) return;

    const text = paragraph.join(" ");
    const collapsedRows = extractTableRows(text);

    if (collapsedRows) {
      const table = parseMarkdownTable(collapsedRows);
      if (table) {
        blocks.push(renderTable(table, key++));
        paragraph = [];
        return;
      }
    }

    blocks.push(<p key={`p-${key++}`}>{renderInline(text)}</p>);
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

  const flushTable = () => {
    if (tableLines.length === 0) return;
    const table = parseMarkdownTable(tableLines);
    if (table) {
      blocks.push(renderTable(table, key++));
    } else {
      for (const row of tableLines) {
        blocks.push(<p key={`p-${key++}`}>{renderInline(row)}</p>);
      }
    }
    tableLines = [];
  };

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();
    const trimmed = line.trim();

    if (!trimmed) {
      flushParagraph();
      flushList();
      flushTable();
      continue;
    }

    if (isTableRow(trimmed) || (tableLines.length > 0 && isSeparatorRow(trimmed))) {
      flushParagraph();
      flushList();
      tableLines.push(trimmed);
      continue;
    }

    if (tableLines.length > 0) {
      flushTable();
    }

    if (isHeading(trimmed)) {
      flushParagraph();
      flushList();
      blocks.push(
        <h3 key={`h-${key++}`}>{renderInline(headingText(trimmed))}</h3>,
      );
      continue;
    }

    if (isBullet(trimmed)) {
      flushParagraph();
      listItems.push(bulletText(trimmed));
      continue;
    }

    flushList();

    if (looksLikeCollapsedTable(trimmed)) {
      flushParagraph();
      const collapsedRows = extractTableRows(trimmed);
      if (collapsedRows) {
        const table = parseMarkdownTable(collapsedRows);
        if (table) {
          blocks.push(renderTable(table, key++));
          continue;
        }
      }
    }

    paragraph.push(trimmed);
  }

  flushParagraph();
  flushList();
  flushTable();

  return <Content>{blocks}</Content>;
}
