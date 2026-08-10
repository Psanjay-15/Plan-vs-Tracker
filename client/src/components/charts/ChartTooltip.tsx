import styled from "styled-components";
import { CHART_COLORS } from "./chartTheme";

const TooltipBox = styled.div`
  min-width: 140px;
  padding: 0.65rem 0.75rem;
  border: 1px solid ${CHART_COLORS.tooltipBorder};
  border-radius: var(--radius-md);
  background: ${CHART_COLORS.tooltipBg};
  box-shadow: var(--shadow-sm);
  color: var(--color-text);

  strong {
    display: block;
    margin-bottom: 0.35rem;
    font-size: var(--font-size-xs);
  }

  p {
    display: flex;
    justify-content: space-between;
    gap: var(--space-4);
    margin: 0.15rem 0;
    color: var(--color-text-muted);
    font-size: var(--font-size-xs);
  }

  span:last-child {
    color: var(--color-text);
    font-weight: 650;
    font-variant-numeric: tabular-nums;
  }
`;

interface TooltipRow {
  label: string;
  value: string;
  color?: string;
}

interface ChartTooltipProps {
  active?: boolean;
  label?: string;
  rows?: TooltipRow[];
}

export function ChartTooltip({ active, label, rows = [] }: ChartTooltipProps) {
  if (!active || rows.length === 0) return null;

  return (
    <TooltipBox>
      {label ? <strong>{label}</strong> : null}
      {rows.map((row) => (
        <p key={row.label}>
          <span style={row.color ? { color: row.color } : undefined}>
            {row.label}
          </span>
          <span>{row.value}</span>
        </p>
      ))}
    </TooltipBox>
  );
}
