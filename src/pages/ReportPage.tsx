import { useEffect, useState } from "react";
import styled from "styled-components";
import { AppIcon } from "../components/common/AppIcon";
import { Card } from "../components/common/Card";
import { PageHeader } from "../components/common/PageHeader";
import { categoryService } from "../services/category.service";
import { reportService } from "../services/report.service";
import type { Category } from "../types/category";
import type { ReportResponse } from "../types/report";
import { getApiErrorMessage } from "../utils/getApiErrorMessage";

const ErrorBanner = styled.div`
  margin-bottom: var(--space-6);
  padding: var(--space-3) var(--space-4);
  border: 1px solid rgb(217 45 32 / 28%);
  border-radius: var(--radius-md);
  background: var(--color-danger-50);
  color: var(--color-danger-600);
  font-size: var(--font-size-sm);
`;

const FilterCard = styled(Card)`
  display: grid;
  grid-template-columns: repeat(3, minmax(180px, 1fr));
  gap: var(--space-4);
  margin-bottom: var(--space-6);
  padding: var(--space-5) var(--space-6);

  @media (max-width: 760px) {
    grid-template-columns: 1fr;
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
  min-height: 126px;
  align-content: space-between;
  gap: var(--space-3);
  padding: var(--space-5);

  @media (max-width: 520px) {
    min-height: 118px;
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
  overflow-x: auto;
`;

const Table = styled.table`
  width: 100%;
  min-width: 860px;
  border-collapse: collapse;

  th,
  td {
    padding: var(--space-4) var(--space-5);
    border-bottom: 1px solid var(--color-border);
    text-align: left;
    vertical-align: middle;
  }

  th {
    background: var(--color-surface-subtle);
    color: var(--color-text-muted);
    font-size: var(--font-size-xs);
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
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

const LoadingState = styled(Card)`
  padding: var(--space-12);
  color: var(--color-text-muted);
  text-align: center;
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

const formatAmount = (minorUnits: number) =>
  new Intl.NumberFormat("en", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(minorUnits / 100);

const formatSignedAmount = (minorUnits: number) => {
  if (minorUnits === 0) return "0.00";
  return `${minorUnits > 0 ? "+" : "−"}${formatAmount(Math.abs(minorUnits))}`;
};

const formatPercentage = (value: number | null) => {
  if (value === null) return "—";
  if (value === 0) return "0.00%";
  return `${value > 0 ? "+" : "−"}${Math.abs(value).toFixed(2)}%`;
};

export function ReportPage() {
  const [startMonth, setStartMonth] = useState(currentMonth);
  const [endMonth, setEndMonth] = useState(currentMonth);
  const [categoryId, setCategoryId] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [report, setReport] = useState<ReportResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

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
    update();
  };

  const rangeInvalid = startMonth > endMonth;
  const summary = report?.summary;

  return (
    <>
      <PageHeader
        title="Plan vs Actual"
        description="Compare spending targets with real results and quickly identify over- or under-spending."
      />

      {rangeInvalid ? (
        <ErrorBanner role="alert">Start month cannot be after end month.</ErrorBanner>
      ) : error ? (
        <ErrorBanner role="alert">{error}</ErrorBanner>
      ) : null}

      <FilterCard>
        <Field>
          <label htmlFor="report-start-month">Start month</label>
          <Control
            id="report-start-month"
            type="month"
            value={startMonth}
            onInput={(event) =>
              changeFilter(() => setStartMonth(event.currentTarget.value))
            }
          />
        </Field>
        <Field>
          <label htmlFor="report-end-month">End month</label>
          <Control
            id="report-end-month"
            type="month"
            value={endMonth}
            onInput={(event) =>
              changeFilter(() => setEndMonth(event.currentTarget.value))
            }
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

      {isLoading && !rangeInvalid ? (
        <LoadingState>Calculating report...</LoadingState>
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
                  {report.rows.map((row) => (
                    <tr key={`${row.categoryId}-${row.month}`}>
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
                      <td>{row.actualEntryCount}</td>
                      <td>
                        <StatusBadge $locked={row.locked}>
                          {row.locked ? "Locked" : "Open"}
                        </StatusBadge>
                      </td>
                    </tr>
                  ))}
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
    </>
  );
}
