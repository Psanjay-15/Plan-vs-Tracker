import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartTooltip } from "./ChartTooltip";
import { CHART_COLORS, formatMonthLabel, toMajorUnits } from "./chartTheme";

export interface PlanActualPoint {
  key: string;
  label: string;
  plan: number;
  actual: number;
}

interface PlanActualBarChartProps {
  data: PlanActualPoint[];
  formatAmount: (minorUnits: number) => string;
  height?: number;
}

export function PlanActualBarChart({
  data,
  formatAmount,
  height = 260,
}: PlanActualBarChartProps) {
  const chartData = data.map((point) => ({
    ...point,
    planMajor: toMajorUnits(point.plan),
    actualMajor: toMajorUnits(point.actual),
  }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={chartData} barGap={4} barCategoryGap="18%">
        <CartesianGrid stroke={CHART_COLORS.grid} vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fill: CHART_COLORS.axis, fontSize: 12 }}
          axisLine={{ stroke: CHART_COLORS.grid }}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: CHART_COLORS.axis, fontSize: 12 }}
          axisLine={false}
          tickLine={false}
          width={54}
        />
        <Tooltip
          cursor={{ fill: "rgb(214 106 58 / 6%)" }}
          content={({ active, label, payload }) => (
            <ChartTooltip
              active={active}
              label={String(label ?? "")}
              rows={(payload ?? []).map((item) => ({
                label: String(item.name),
                value: formatAmount(Number(item.payload?.[item.dataKey === "planMajor" ? "plan" : "actual"] ?? 0)),
                color: String(item.color ?? CHART_COLORS.text),
              }))}
            />
          )}
        />
        <Legend
          wrapperStyle={{ fontSize: 12, color: CHART_COLORS.text }}
          iconType="circle"
        />
        <Bar
          dataKey="planMajor"
          name="Plan"
          fill={CHART_COLORS.plan}
          radius={[4, 4, 0, 0]}
          maxBarSize={36}
        />
        <Bar
          dataKey="actualMajor"
          name="Actual"
          fill={CHART_COLORS.actual}
          radius={[4, 4, 0, 0]}
          maxBarSize={36}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

export const toMonthlyPlanActualPoints = (
  months: Array<{ month: string; plan: number; actual: number }>,
): PlanActualPoint[] =>
  months.map((item) => ({
    key: item.month,
    label: formatMonthLabel(item.month),
    plan: item.plan,
    actual: item.actual,
  }));

export const toCategoryPlanActualPoints = (
  rows: Array<{ categoryName: string; plan: number; actual: number }>,
): PlanActualPoint[] => {
  const byCategory = new Map<string, { plan: number; actual: number }>();

  for (const row of rows) {
    const current = byCategory.get(row.categoryName) ?? { plan: 0, actual: 0 };
    current.plan += row.plan;
    current.actual += row.actual;
    byCategory.set(row.categoryName, current);
  }

  return [...byCategory.entries()]
    .map(([categoryName, totals]) => ({
      key: categoryName,
      label: categoryName,
      plan: totals.plan,
      actual: totals.actual,
    }))
    .sort((first, second) => second.actual - first.actual);
};
