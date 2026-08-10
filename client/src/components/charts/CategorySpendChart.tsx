import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { ChartTooltip } from "./ChartTooltip";
import { CHART_COLORS, toMajorUnits } from "./chartTheme";

export interface CategorySpendPoint {
  name: string;
  value: number;
}

interface CategorySpendChartProps {
  data: CategorySpendPoint[];
  formatAmount: (minorUnits: number) => string;
  height?: number;
}

export function CategorySpendChart({
  data,
  formatAmount,
  height = 220,
}: CategorySpendChartProps) {
  const chartData = data
    .filter((item) => item.value > 0)
    .map((item) => ({
      ...item,
      major: toMajorUnits(item.value),
    }));

  if (chartData.length === 0) {
    return null;
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={chartData}
          dataKey="major"
          nameKey="name"
          cx="50%"
          cy="50%"
          innerRadius="52%"
          outerRadius="78%"
          paddingAngle={2}
        >
          {chartData.map((entry, index) => (
            <Cell
              key={entry.name}
              fill={CHART_COLORS.palette[index % CHART_COLORS.palette.length]}
              stroke={CHART_COLORS.tooltipBg}
              strokeWidth={2}
            />
          ))}
        </Pie>
        <Tooltip
          content={({ active, payload }) => {
            const point = payload?.[0]?.payload as
              | { name?: string; value?: number }
              | undefined;
            return (
              <ChartTooltip
                active={active}
                label={point?.name}
                rows={
                  point
                    ? [
                        {
                          label: "Actual",
                          value: formatAmount(point.value ?? 0),
                        },
                      ]
                    : []
                }
              />
            );
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

export const toCategorySpendPoints = (
  rows: Array<{ categoryName: string; actual: number }>,
): CategorySpendPoint[] => {
  const byCategory = new Map<string, number>();

  for (const row of rows) {
    byCategory.set(
      row.categoryName,
      (byCategory.get(row.categoryName) ?? 0) + row.actual,
    );
  }

  return [...byCategory.entries()]
    .map(([name, value]) => ({ name, value }))
    .sort((first, second) => second.value - first.value);
};
