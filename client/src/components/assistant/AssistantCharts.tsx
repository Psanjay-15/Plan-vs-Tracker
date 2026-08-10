import styled from "styled-components";
import { CategorySpendChart } from "../charts/CategorySpendChart";
import { MonthlyVarianceChart } from "../charts/MonthlyVarianceChart";
import { PlanActualBarChart } from "../charts/PlanActualBarChart";
import { useCurrency } from "../../hooks/useCurrency";
import type { AssistantChart } from "../../types/assistant";

const ChartsStack = styled.div`
  display: grid;
  gap: var(--space-3);
  margin-top: var(--space-3);
`;

const ChartBlock = styled.div`
  padding: var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface-subtle);

  h4 {
    margin: 0 0 var(--space-2);
    color: var(--color-text-muted);
    font-size: 0.7rem;
    font-weight: 750;
    letter-spacing: 0.02em;
    text-transform: uppercase;
  }
`;

interface AssistantChartsProps {
  charts: AssistantChart[];
}

export function AssistantCharts({ charts }: AssistantChartsProps) {
  const { formatAmount, formatSignedAmount } = useCurrency();

  if (charts.length === 0) return null;

  return (
    <ChartsStack>
      {charts.map((chart) => (
        <ChartBlock key={chart.id}>
          <h4>{chart.title}</h4>
          {chart.type === "plan_actual_bars" ? (
            <PlanActualBarChart
              data={chart.points.map((point) => ({
                key: point.key,
                label: point.label,
                plan: point.plan ?? 0,
                actual: point.actual ?? 0,
              }))}
              formatAmount={formatAmount}
              height={180}
            />
          ) : null}
          {chart.type === "monthly_variance" ? (
            <MonthlyVarianceChart
              data={chart.points.map((point) => ({
                key: point.key,
                label: point.label,
                variance: point.variance ?? 0,
              }))}
              formatSignedAmount={formatSignedAmount}
              height={170}
            />
          ) : null}
          {chart.type === "category_spend" ? (
            <CategorySpendChart
              data={chart.points.map((point) => ({
                name: point.label,
                value: point.value ?? 0,
              }))}
              formatAmount={formatAmount}
              height={170}
            />
          ) : null}
        </ChartBlock>
      ))}
    </ChartsStack>
  );
}
