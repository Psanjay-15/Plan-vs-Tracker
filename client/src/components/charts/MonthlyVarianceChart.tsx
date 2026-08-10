import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartTooltip } from "./ChartTooltip";
import { CHART_COLORS, formatMonthLabel, toMajorUnits } from "./chartTheme";

export interface VariancePoint {
  key: string;
  label: string;
  variance: number;
}

interface MonthlyVarianceChartProps {
  data: VariancePoint[];
  formatSignedAmount: (minorUnits: number) => string;
  height?: number;
}

export function MonthlyVarianceChart({
  data,
  formatSignedAmount,
  height = 240,
}: MonthlyVarianceChartProps) {
  const chartData = data.map((point) => ({
    ...point,
    varianceMajor: toMajorUnits(point.variance),
  }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={chartData} barCategoryGap="22%">
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
        <ReferenceLine y={0} stroke={CHART_COLORS.axis} />
        <Tooltip
          cursor={{ fill: "rgb(214 106 58 / 6%)" }}
          content={({ active, label, payload }) => {
            const point = payload?.[0]?.payload as
              | { variance?: number }
              | undefined;
            return (
              <ChartTooltip
                active={active}
                label={String(label ?? "")}
                rows={
                  point
                    ? [
                        {
                          label: "Variance",
                          value: formatSignedAmount(point.variance ?? 0),
                          color:
                            (point.variance ?? 0) > 0
                              ? CHART_COLORS.over
                              : CHART_COLORS.under,
                        },
                      ]
                    : []
                }
              />
            );
          }}
        />
        <Bar dataKey="varianceMajor" name="Variance" radius={[4, 4, 4, 4]} maxBarSize={42}>
          {chartData.map((entry) => (
            <Cell
              key={entry.key}
              fill={entry.variance >= 0 ? CHART_COLORS.over : CHART_COLORS.under}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export const toMonthlyVariancePoints = (
  months: Array<{ month: string; variance: number }>,
): VariancePoint[] =>
  months.map((item) => ({
    key: item.month,
    label: formatMonthLabel(item.month),
    variance: item.variance,
  }));
