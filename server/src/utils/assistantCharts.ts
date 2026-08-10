export type AssistantChartType =
  | "plan_actual_bars"
  | "monthly_variance"
  | "category_spend";

export interface AssistantChartPoint {
  key: string;
  label: string;
  plan?: number;
  actual?: number;
  variance?: number;
  value?: number;
}

export interface AssistantChart {
  id: string;
  title: string;
  type: AssistantChartType;
  points: AssistantChartPoint[];
}

interface ReportLike {
  range?: { startMonth?: string; endMonth?: string };
  monthlyTotals?: Array<{
    month: string;
    plan: number;
    actual: number;
    variance: number;
  }>;
  rows?: Array<{
    categoryName: string;
    plan: number;
    actual: number;
  }>;
}

const formatMonthLabel = (month: string) => {
  const [year, monthNumber] = month.split("-").map(Number);
  return new Intl.DateTimeFormat("en", {
    month: "short",
    year: "2-digit",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, monthNumber - 1, 1)));
};

export const buildChartsFromReport = (
  report: ReportLike,
): AssistantChart[] => {
  const charts: AssistantChart[] = [];
  const monthlyTotals = report.monthlyTotals ?? [];
  const rows = report.rows ?? [];

  if (monthlyTotals.length > 0) {
    charts.push({
      id: `plan-actual-${report.range?.startMonth ?? "range"}`,
      title: "Plan vs actual by month",
      type: "plan_actual_bars",
      points: monthlyTotals.map((total) => ({
        key: total.month,
        label: formatMonthLabel(total.month),
        plan: total.plan,
        actual: total.actual,
      })),
    });

    charts.push({
      id: `variance-${report.range?.startMonth ?? "range"}`,
      title: "Monthly net variance",
      type: "monthly_variance",
      points: monthlyTotals.map((total) => ({
        key: total.month,
        label: formatMonthLabel(total.month),
        variance: total.variance,
      })),
    });
  }

  if (rows.length > 0) {
    const byCategory = new Map<string, number>();
    for (const row of rows) {
      byCategory.set(
        row.categoryName,
        (byCategory.get(row.categoryName) ?? 0) + row.actual,
      );
    }

    const points = [...byCategory.entries()]
      .map(([name, value]) => ({
        key: name,
        label: name,
        value,
      }))
      .filter((point) => (point.value ?? 0) > 0)
      .sort((first, second) => (second.value ?? 0) - (first.value ?? 0));

    if (points.length > 0) {
      charts.push({
        id: `category-spend-${report.range?.startMonth ?? "range"}`,
        title: "Spending by category",
        type: "category_spend",
        points,
      });
    }
  }

  return charts.slice(0, 3);
};
