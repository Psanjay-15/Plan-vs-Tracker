import { Fragment, useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import { CategorySpendChart, toCategorySpendPoints } from "../components/charts/CategorySpendChart";
import { CHART_COLORS } from "../components/charts/chartTheme";
import {
  MonthlyVarianceChart,
  toMonthlyVariancePoints,
} from "../components/charts/MonthlyVarianceChart";
import {
  PlanActualBarChart,
  toMonthlyPlanActualPoints,
} from "../components/charts/PlanActualBarChart";
import { AppIcon } from "../components/common/AppIcon";
import { Button } from "../components/common/Button";
import { Card } from "../components/common/Card";
import { PageHeader } from "../components/common/PageHeader";
import {
  SkeletonCard,
  SkeletonPulse,
  SkeletonRow,
} from "../components/common/Skeleton";
import { useCurrency } from "../hooks/useCurrency";
import { actualService } from "../services/actual.service";
import { categoryService } from "../services/category.service";
import { reportService } from "../services/report.service";
import type { Actual } from "../types/actual";
import type { Category } from "../types/category";
import type { ReportResponse } from "../types/report";
import { downloadTextFile } from "../utils/download";
import { getApiErrorMessage } from "../utils/getApiErrorMessage";

type ChartView = "bars" | "variance" | "category";

const ErrorBanner = styled.div`
  margin-bottom: var(--space-6);
  padding: var(--space-3) var(--space-4);
  border: 1px solid rgb(217 45 32 / 28%);
  border-radius: var(--radius-md);
  background: var(--color-danger-50);
  color: var(--color-danger-600);
  font-size: var(--font-size-sm);
`;

const ReportShell = styled.div`
  display: block;
  width: 100%;
`;

const FilterCard = styled(Card)`
  display: grid;
  grid-template-columns: repeat(4, minmax(160px, 1fr));
  gap: var(--space-4);
  margin-bottom: var(--space-6);
  padding: var(--space-5) var(--space-6);

  @media (max-width: 980px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (max-width: 620px) {
    grid-template-columns: 1fr;
  }
`;

const RulesNote = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2) var(--space-5);
  margin: calc(var(--space-2) * -1) 0 var(--space-6);
  color: var(--color-text-muted);
  font-size: var(--font-size-xs);

  strong {
    color: var(--color-text);
  }
`;

const Field = styled.div`
  display: grid;
  gap: var(--space-2);

  label {
    font-size: var(--font-size-sm);
    font-weight: 650;
  }
`;

const Control = styled.input`
  width: 100%;
  min-height: 2.75rem;
  padding: 0.65rem 0.8rem;
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-md);
  outline: none;
  background-color: var(--color-surface);
  color: var(--color-text);

  &:focus {
    border-color: var(--color-primary-500);
    box-shadow: var(--focus-ring);
  }
`;

const Select = styled.select`
  width: 100%;
  min-height: 2.75rem;
  padding: 0.65rem 2.25rem 0.65rem 0.8rem;
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-md);
  outline: none;
  background-color: var(--color-surface);
  color: var(--color-text);

  &:focus {
    border-color: var(--color-primary-500);
    box-shadow: var(--focus-ring);
  }
`;

const SummaryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--space-4);
  margin-bottom: var(--space-6);

  @media (max-width: 900px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (max-width: 380px) {
    grid-template-columns: 1fr;
  }
`;

const SummaryCard = styled(Card)`
  display: grid;
  align-content: start;
  gap: var(--space-3);
  padding: var(--space-5);

  @media (max-width: 520px) {
    padding: var(--space-4);
  }

  span {
    display: block;
    margin-bottom: var(--space-2);
    color: var(--color-text-muted);
    font-size: var(--font-size-sm);
  }

  strong {
    display: block;
    font-size: var(--font-size-2xl);
    font-variant-numeric: tabular-nums;
    line-height: var(--line-height-tight);
  }

  small {
    display: block;
    margin-top: var(--space-2);
    color: var(--color-text-subtle);
    font-size: var(--font-size-xs);
    line-height: 1.4;
  }
`;

const VarianceValue = styled.strong<{ $value: number }>`
  color: ${({ $value }) =>
    $value > 0
      ? "var(--color-danger-600)"
      : $value < 0
        ? "var(--color-success-600)"
        : "var(--color-text)"};
`;

const ChartGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-4);
  margin-bottom: var(--space-6);
`;

const ChartToolbar = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  margin-bottom: var(--space-4);
`;

const ChartToggleGroup = styled.div`
  display: inline-flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  padding: 0.25rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-full);
  background: var(--color-surface-subtle);
`;

const ChartToggle = styled.button<{ $active: boolean }>`
  padding: 0.45rem 0.8rem;
  border: 0;
  border-radius: var(--radius-full);
  background: ${({ $active }) =>
    $active ? "var(--color-primary-600)" : "transparent"};
  color: ${({ $active }) => ($active ? "#ffffff" : "var(--color-text-muted)")};
  font-size: var(--font-size-xs);
  font-weight: 700;
  cursor: pointer;

  &:hover {
    color: ${({ $active }) =>
      $active ? "#ffffff" : "var(--color-text)"};
  }
`;

const ChartCard = styled(Card)`
  margin-bottom: 0;
  padding: var(--space-5);

  h2 {
    margin-bottom: var(--space-1);
    font-size: var(--font-size-lg);
  }

  > p {
    margin-bottom: var(--space-4);
    color: var(--color-text-muted);
    font-size: var(--font-size-sm);
  }
`;

const ChartLegend = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-4);
  margin-top: var(--space-3);
  color: var(--color-text-muted);
  font-size: var(--font-size-xs);

  span::before {
    display: inline-block;
    width: 0.55rem;
    height: 0.55rem;
    margin-right: var(--space-2);
    border-radius: var(--radius-full);
    background: var(--color-success-600);
    content: "";
  }

  span:last-child::before {
    background: var(--color-danger-600);
  }
`;

const CategoryLegend = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem 0.85rem;
  margin-top: var(--space-2);
`;

const CategoryLegendItem = styled.span<{ $color: string }>`
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  color: var(--color-text-muted);
  font-size: var(--font-size-xs);

  &::before {
    width: 0.5rem;
    height: 0.5rem;
    border-radius: var(--radius-full);
    background: ${({ $color }) => $color};
    content: "";
  }
`;

const ReportSkeleton = styled.div`
  display: grid;
  gap: var(--space-4);
`;

const SkeletonSummaryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--space-4);

  @media (max-width: 900px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`;

const TableCard = styled(Card)`
  overflow: hidden;
  margin-bottom: var(--space-6);
  padding: 0;
`;

const TableHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-4);
  padding: var(--space-5) var(--space-6);
  border-bottom: 1px solid var(--color-border);

  h2 {
    margin: 0 0 var(--space-1);
    font-size: var(--font-size-lg);
  }

  p,
  span {
    margin: 0;
    color: var(--color-text-muted);
    font-size: var(--font-size-sm);
  }
`;

const TableScroll = styled.div`
  max-height: min(520px, 60vh);
  overflow: auto;
`;

const Table = styled.table`
  width: 100%;
  min-width: 860px;
  border-collapse: separate;
  border-spacing: 0;

  th,
  td {
    padding: var(--space-4) var(--space-5);
    border-bottom: 1px solid var(--color-border);
    text-align: left;
    vertical-align: middle;
  }

  th {
    position: sticky;
    top: 0;
    z-index: 2;
    background: var(--color-surface-subtle);
    color: var(--color-text-muted);
    font-size: var(--font-size-xs);
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    box-shadow: inset 0 -1px 0 var(--color-border);
  }

  th:nth-child(n + 3):not(:last-child),
  td:nth-child(n + 3):not(:last-child) {
    text-align: right;
  }

  tbody tr:last-child td {
    border-bottom: 0;
  }
`;

const CategoryName = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-3);
  font-weight: 650;
`;

const CategoryMark = styled.span`
  display: grid;
  width: 2rem;
  height: 2rem;
  flex: 0 0 auto;
  place-items: center;
  border-radius: var(--radius-md);
  background: var(--color-primary-50);
  color: var(--color-primary-700);
  font-size: var(--font-size-sm);
  font-weight: 750;
`;

const NumberValue = styled.span`
  font-variant-numeric: tabular-nums;
`;

const TableVariance = styled(NumberValue)<{ $value: number }>`
  color: ${({ $value }) =>
    $value > 0
      ? "var(--color-danger-600)"
      : $value < 0
        ? "var(--color-success-600)"
        : "var(--color-text)"};
  font-weight: 650;
`;

const EntriesButton = styled.button`
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--color-primary-600);
  font-weight: 700;
  text-decoration: underline;
  text-underline-offset: 0.2rem;
  cursor: pointer;

  &:focus-visible {
    outline: none;
    border-radius: var(--radius-sm);
    box-shadow: var(--focus-ring);
  }
`;

const DrillCell = styled.td`
  padding: 0 !important;
  background: var(--color-surface-subtle);
`;

const DrillPanel = styled.div`
  padding: var(--space-5) var(--space-6);

  h3 {
    margin-bottom: var(--space-3);
    font-size: var(--font-size-sm);
  }
`;

const DrillError = styled.p`
  margin: 0;
  color: var(--color-danger-600);
  font-size: var(--font-size-sm);
`;

const EntryList = styled.div`
  display: grid;
  gap: var(--space-2);
`;

const EntryItem = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: var(--space-4);
  padding: var(--space-3) var(--space-4);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);

  p {
    margin: 0;
    color: var(--color-text-muted);
    font-size: var(--font-size-sm);
  }

  strong {
    font-variant-numeric: tabular-nums;
  }
`;

const StatusBadge = styled.span<{ $locked: boolean }>`
  display: inline-flex;
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-full);
  background: ${({ $locked }) =>
    $locked ? "var(--color-warning-50)" : "var(--color-success-50)"};
  color: ${({ $locked }) =>
    $locked ? "var(--color-warning-600)" : "var(--color-success-600)"};
  font-size: var(--font-size-xs);
  font-weight: 700;
`;

const EmptyState = styled(Card)`
  padding: var(--space-12) var(--space-6);
  color: var(--color-text-muted);
  text-align: center;

  h2 {
    margin-bottom: var(--space-2);
    color: var(--color-text);
    font-size: var(--font-size-lg);
  }

  p {
    margin: 0;
  }
`;

const escapeCsv = (value: string | number) => {
  const text = String(value);
  if (/[",\r\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
};

const toMajor = (minorUnits: number) => (minorUnits / 100).toFixed(2);

const formatCsvPercentage = (value: number | null) => {
  if (value === null) return "";
  const sign = value > 0 ? "+" : value < 0 ? "-" : "";
  return `${sign}${Math.abs(value).toFixed(2)}%`;
};

const formatCsvSignedAmount = (minorUnits: number) => {
  const major = toMajor(Math.abs(minorUnits));
  if (minorUnits > 0) return `+${major}`;
  if (minorUnits < 0) return `-${major}`;
  return major;
};

const currentMonth = () => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
};

const formatMonth = (month: string) => {
  const [year, monthNumber] = month.split("-").map(Number);
  return new Intl.DateTimeFormat("en", {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, monthNumber - 1, 1)));
};

const formatPercentage = (value: number | null) => {
  if (value === null) return "—";
  if (value === 0) return "0.00%";
  return `${value > 0 ? "+" : "−"}${Math.abs(value).toFixed(2)}%`;
};

const getFiscalYearOptions = () => {
  const year = new Date().getFullYear();
  return Array.from({ length: 7 }, (_, index) => year - 4 + index);
};

export function ReportPage() {
  const { formatAmount, formatSignedAmount } = useCurrency();
  const [startMonth, setStartMonth] = useState(currentMonth);
  const [endMonth, setEndMonth] = useState(currentMonth);
  const [fiscalYear, setFiscalYear] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [report, setReport] = useState<ReportResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [chartView, setChartView] = useState<ChartView>("bars");
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [drillEntries, setDrillEntries] = useState<Actual[]>([]);
  const [isDrillLoading, setIsDrillLoading] = useState(false);
  const [drillError, setDrillError] = useState("");

  const fiscalYearOptions = useMemo(() => getFiscalYearOptions(), []);

  useEffect(() => {
    let isActive = true;

    if (startMonth > endMonth) {
      return () => {
        isActive = false;
      };
    }

    Promise.all([
      categoryService.getAll(),
      reportService.getPlanVsActual({
        startMonth,
        endMonth,
        ...(categoryId ? { categoryId } : {}),
      }),
    ])
      .then(([categoryResult, reportResult]) => {
        if (!isActive) return;
        setCategories(categoryResult);
        setReport(reportResult);
      })
      .catch((requestError) => {
        if (isActive) {
          setError(getApiErrorMessage(requestError, "Unable to load report."));
        }
      })
      .finally(() => {
        if (isActive) setIsLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, [categoryId, endMonth, startMonth]);

  const changeFilter = (update: () => void) => {
    setIsLoading(true);
    setError("");
    setExpandedRow(null);
    setDrillEntries([]);
    update();
  };

  const handleFiscalYearChange = (value: string) => {
    setFiscalYear(value);
    if (!value) return;

    const startYear = Number(value);
    changeFilter(() => {
      setStartMonth(`${startYear}-04`);
      setEndMonth(`${startYear + 1}-03`);
    });
  };

  const handleDrillDown = async (row: ReportResponse["rows"][number]) => {
    const rowKey = `${row.categoryId}-${row.month}`;
    if (expandedRow === rowKey) {
      setExpandedRow(null);
      setDrillEntries([]);
      return;
    }

    setExpandedRow(rowKey);
    setDrillEntries([]);
    setDrillError("");
    setIsDrillLoading(true);
    try {
      const entries = await actualService.getAll({
        month: row.month,
        categoryId: row.categoryId,
      });
      setDrillEntries(entries);
    } catch (requestError) {
      setDrillError(
        getApiErrorMessage(requestError, "Unable to load actual entries."),
      );
    } finally {
      setIsDrillLoading(false);
    }
  };

  const handleExportCsv = () => {
    if (!report || report.rows.length === 0) return;

    const lines = [
      ["Month", "Category", "Plan", "Actual", "Variance", "Variance %"]
        .map(escapeCsv)
        .join(","),
      ...report.rows.map((row) =>
        [
          row.month,
          row.categoryName,
          toMajor(row.plan),
          toMajor(row.actual),
          formatCsvSignedAmount(row.variance),
          formatCsvPercentage(row.variancePercentage),
        ]
          .map(escapeCsv)
          .join(","),
      ),
    ];

    downloadTextFile(
      `${lines.join("\n")}\n`,
      `plan-vs-actual-${startMonth}-to-${endMonth}.csv`,
    );
  };

  const rangeInvalid = startMonth > endMonth;
  const summary = report?.summary;

  return (
    <ReportShell>
      <PageHeader
        title="Plan vs Actual"
        description="Compare spending targets with real results and quickly identify over- or under-spending."
        action={
          <Button
            variant="secondary"
            disabled={!report || report.rows.length === 0 || rangeInvalid}
            onClick={handleExportCsv}
          >
            Export CSV
          </Button>
        }
      />

      {rangeInvalid ? (
        <ErrorBanner role="alert">Start month cannot be after end month.</ErrorBanner>
      ) : error ? (
        <ErrorBanner role="alert">{error}</ErrorBanner>
      ) : null}

      <FilterCard>
        <Field>
          <label htmlFor="report-fiscal-year">Fiscal year (Apr–Mar)</label>
          <Select
            id="report-fiscal-year"
            value={fiscalYear}
            onChange={(event) => handleFiscalYearChange(event.target.value)}
          >
            <option value="">Custom range</option>
            {fiscalYearOptions.map((year) => (
              <option key={year} value={year}>
                FY {year}–{String(year + 1).slice(-2)}
              </option>
            ))}
          </Select>
        </Field>
        <Field>
          <label htmlFor="report-start-month">Start month</label>
          <Control
            id="report-start-month"
            type="month"
            value={startMonth}
            onInput={(event) => {
              setFiscalYear("");
              changeFilter(() => setStartMonth(event.currentTarget.value));
            }}
          />
        </Field>
        <Field>
          <label htmlFor="report-end-month">End month</label>
          <Control
            id="report-end-month"
            type="month"
            value={endMonth}
            onInput={(event) => {
              setFiscalYear("");
              changeFilter(() => setEndMonth(event.currentTarget.value));
            }}
          />
        </Field>
        <Field>
          <label htmlFor="report-category">Category</label>
          <Select
            id="report-category"
            value={categoryId}
            onChange={(event) =>
              changeFilter(() => setCategoryId(event.target.value))
            }
          >
            <option value="">All categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </Select>
        </Field>
      </FilterCard>

      <RulesNote>
        <span><strong>Missing actual:</strong> treated as 0.</span>
        <span><strong>Plan is 0:</strong> variance percentage is shown as —.</span>
      </RulesNote>

      {isLoading && !rangeInvalid ? (
        <ReportSkeleton>
          <SkeletonSummaryGrid>
            {Array.from({ length: 4 }).map((_, index) => (
              <SkeletonCard key={index}>
                <SkeletonPulse $height="0.8rem" $width="45%" />
                <SkeletonPulse $height="1.6rem" $width="70%" />
                <SkeletonPulse $height="0.7rem" $width="55%" />
              </SkeletonCard>
            ))}
          </SkeletonSummaryGrid>
          <SkeletonCard>
            <SkeletonPulse $height="1rem" $width="35%" />
            <SkeletonPulse $height="220px" />
          </SkeletonCard>
          <SkeletonCard>
            <SkeletonPulse $height="1rem" $width="30%" />
            <SkeletonRow>
              <SkeletonPulse $height="0.85rem" />
              <SkeletonPulse $height="0.85rem" />
              <SkeletonPulse $height="0.85rem" />
              <SkeletonPulse $height="0.85rem" />
            </SkeletonRow>
            <SkeletonRow>
              <SkeletonPulse $height="0.85rem" />
              <SkeletonPulse $height="0.85rem" />
              <SkeletonPulse $height="0.85rem" />
              <SkeletonPulse $height="0.85rem" />
            </SkeletonRow>
          </SkeletonCard>
        </ReportSkeleton>
      ) : report && report.rows.length > 0 && summary && !rangeInvalid ? (
        <>
          <SummaryGrid>
            <SummaryCard>
              <span>Total planned</span>
              <strong>{formatAmount(summary.totalPlan)}</strong>
              <small>Target for selected range</small>
            </SummaryCard>
            <SummaryCard>
              <span>Total actual</span>
              <strong>{formatAmount(summary.totalActual)}</strong>
              <small>Recorded spending</small>
            </SummaryCard>
            <SummaryCard>
              <span>Variance</span>
              <VarianceValue $value={summary.totalVariance}>
                {formatSignedAmount(summary.totalVariance)}
              </VarianceValue>
              <small>Actual minus plan</small>
            </SummaryCard>
            <SummaryCard>
              <span>Variance percentage</span>
              <VarianceValue $value={summary.totalVariance}>
                {formatPercentage(summary.variancePercentage)}
              </VarianceValue>
              <small>
                {summary.variancePercentage === null
                  ? "Unavailable when plan is zero"
                  : "Compared with planned amount"}
              </small>
            </SummaryCard>
          </SummaryGrid>

          <ChartGrid>
            <ChartCard>
              <ChartToolbar>
                <div>
                  <h2>
                    {chartView === "bars"
                      ? "Plan vs actual by month"
                      : chartView === "variance"
                        ? "Monthly net variance"
                        : "Spending by category"}
                  </h2>
                  <p>
                    {chartView === "bars"
                      ? "Compare monthly targets with recorded spending."
                      : chartView === "variance"
                        ? "Actual minus plan for each month. Green is under plan, red is over plan."
                        : "Share of actual spend across categories in this range."}
                  </p>
                </div>
                <ChartToggleGroup role="tablist" aria-label="Chart type">
                  <ChartToggle
                    type="button"
                    $active={chartView === "bars"}
                    onClick={() => setChartView("bars")}
                  >
                    Bars
                  </ChartToggle>
                  <ChartToggle
                    type="button"
                    $active={chartView === "variance"}
                    onClick={() => setChartView("variance")}
                  >
                    Variance
                  </ChartToggle>
                  <ChartToggle
                    type="button"
                    $active={chartView === "category"}
                    onClick={() => setChartView("category")}
                  >
                    Category
                  </ChartToggle>
                </ChartToggleGroup>
              </ChartToolbar>

              {chartView === "bars" ? (
                <PlanActualBarChart
                  data={toMonthlyPlanActualPoints(report.monthlyTotals)}
                  formatAmount={formatAmount}
                  height={280}
                />
              ) : null}

              {chartView === "variance" ? (
                <>
                  <MonthlyVarianceChart
                    data={toMonthlyVariancePoints(report.monthlyTotals)}
                    formatSignedAmount={formatSignedAmount}
                    height={280}
                  />
                  <ChartLegend>
                    <span>Under plan</span>
                    <span>Over plan</span>
                  </ChartLegend>
                </>
              ) : null}

              {chartView === "category" ? (
                <>
                  <CategorySpendChart
                    data={toCategorySpendPoints(report.rows)}
                    formatAmount={formatAmount}
                    height={260}
                  />
                  <CategoryLegend>
                    {toCategorySpendPoints(report.rows)
                      .filter((item) => item.value > 0)
                      .slice(0, 8)
                      .map((item, index) => (
                        <CategoryLegendItem
                          key={item.name}
                          $color={
                            CHART_COLORS.palette[
                              index % CHART_COLORS.palette.length
                            ]
                          }
                        >
                          {item.name}
                        </CategoryLegendItem>
                      ))}
                  </CategoryLegend>
                </>
              ) : null}
            </ChartCard>
          </ChartGrid>

          <TableCard>
            <TableHeader>
              <div>
                <h2>Category comparison</h2>
                <p>Positive variance means spending exceeded the plan.</p>
              </div>
              <span>{report.rows.length} rows</span>
            </TableHeader>
            <TableScroll>
              <Table>
                <thead>
                  <tr>
                    <th>Category</th>
                    <th>Month</th>
                    <th>Plan</th>
                    <th>Actual</th>
                    <th>Variance</th>
                    <th>Variance %</th>
                    <th>Entries</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {report.rows.map((row) => {
                    const rowKey = `${row.categoryId}-${row.month}`;
                    return (
                    <Fragment key={rowKey}>
                    <tr>
                      <td>
                        <CategoryName>
                          <CategoryMark><AppIcon name="category" size={15} /></CategoryMark>
                          {row.categoryName}
                        </CategoryName>
                      </td>
                      <td>{formatMonth(row.month)}</td>
                      <td><NumberValue>{formatAmount(row.plan)}</NumberValue></td>
                      <td><NumberValue>{formatAmount(row.actual)}</NumberValue></td>
                      <td>
                        <TableVariance $value={row.variance}>
                          {formatSignedAmount(row.variance)}
                        </TableVariance>
                      </td>
                      <td>
                        <TableVariance $value={row.variance}>
                          {formatPercentage(row.variancePercentage)}
                        </TableVariance>
                      </td>
                      <td>
                        {row.actualEntryCount > 0 ? (
                          <EntriesButton
                            type="button"
                            aria-expanded={expandedRow === rowKey}
                            onClick={() => void handleDrillDown(row)}
                          >
                            {row.actualEntryCount}
                          </EntriesButton>
                        ) : "0"}
                      </td>
                      <td>
                        <StatusBadge $locked={row.locked}>
                          {row.locked ? "Locked" : "Open"}
                        </StatusBadge>
                      </td>
                    </tr>
                    {expandedRow === rowKey ? (
                      <tr>
                        <DrillCell colSpan={8}>
                          <DrillPanel>
                            <h3>Actual entries for {row.categoryName} · {formatMonth(row.month)}</h3>
                            {isDrillLoading ? (
                              <p>Loading underlying entries...</p>
                            ) : drillError ? (
                              <DrillError>{drillError}</DrillError>
                            ) : (
                              <EntryList>
                                {drillEntries.map((entry) => (
                                  <EntryItem key={entry.id}>
                                    <p>{entry.note || "No note provided"}</p>
                                    <strong>{formatAmount(entry.amount)}</strong>
                                  </EntryItem>
                                ))}
                              </EntryList>
                            )}
                          </DrillPanel>
                        </DrillCell>
                      </tr>
                    ) : null}
                    </Fragment>
                  )})}
                </tbody>
              </Table>
            </TableScroll>
          </TableCard>

          <TableCard>
            <TableHeader>
              <div>
                <h2>Monthly totals</h2>
                <p>Combined performance across the selected categories.</p>
              </div>
              <span>{report.monthlyTotals.length} months</span>
            </TableHeader>
            <TableScroll>
              <Table>
                <thead>
                  <tr>
                    <th>Month</th>
                    <th>Plan</th>
                    <th>Actual</th>
                    <th>Variance</th>
                    <th>Variance %</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {report.monthlyTotals.map((total) => (
                    <tr key={total.month}>
                      <td>{formatMonth(total.month)}</td>
                      <td><NumberValue>{formatAmount(total.plan)}</NumberValue></td>
                      <td><NumberValue>{formatAmount(total.actual)}</NumberValue></td>
                      <td>
                        <TableVariance $value={total.variance}>
                          {formatSignedAmount(total.variance)}
                        </TableVariance>
                      </td>
                      <td>
                        <TableVariance $value={total.variance}>
                          {formatPercentage(total.variancePercentage)}
                        </TableVariance>
                      </td>
                      <td>
                        <StatusBadge $locked={total.locked}>
                          {total.locked ? "Locked" : "Open"}
                        </StatusBadge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </TableScroll>
          </TableCard>
        </>
      ) : !rangeInvalid && !error ? (
        <EmptyState>
          <h2>No report data for this range</h2>
          <p>Add a Plan or Actual entry, or choose another month.</p>
        </EmptyState>
      ) : null}
    </ReportShell>
  );
}
