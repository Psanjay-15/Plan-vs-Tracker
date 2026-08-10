import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import styled from "styled-components";
import { AppIcon } from "../components/common/AppIcon";
import { Card } from "../components/common/Card";
import { PageHeader } from "../components/common/PageHeader";
import { useAuth } from "../hooks/useAuth";
import { useCurrency } from "../hooks/useCurrency";
import { categoryService } from "../services/category.service";
import { periodLockService } from "../services/period-lock.service";
import { reportService } from "../services/report.service";
import type { Category } from "../types/category";
import type { PeriodLock } from "../types/period-lock";
import type { ReportResponse, ReportRow } from "../types/report";
import { getApiErrorMessage } from "../utils/getApiErrorMessage";

const OverviewShell = styled.div`
  display: flex;
  min-height: calc(100vh - 4rem);
  flex-direction: column;

  @media (max-width: 860px) {
    min-height: auto;
  }
`;

const MonthField = styled.div`
  display: grid;
  gap: var(--space-2);

  label {
    color: var(--color-text-muted);
    font-size: var(--font-size-xs);
    font-weight: 700;
    letter-spacing: 0.03em;
    text-transform: uppercase;
  }
`;

const MonthInput = styled.input`
  min-height: 2.75rem;
  padding: 0.65rem 0.8rem;
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-md);
  outline: none;
  background: var(--color-surface);
  color: var(--color-text);

  &:focus {
    border-color: var(--color-primary-500);
    box-shadow: var(--focus-ring);
  }
`;

const ErrorBanner = styled.div`
  margin-bottom: var(--space-6);
  padding: var(--space-3) var(--space-4);
  border: 1px solid rgb(217 45 32 / 28%);
  border-radius: var(--radius-md);
  background: var(--color-danger-50);
  color: var(--color-danger-600);
  font-size: var(--font-size-sm);
`;

const SummaryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--space-4);
  margin-bottom: var(--space-5);

  @media (max-width: 1000px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (max-width: 380px) {
    grid-template-columns: 1fr;
  }
`;

const SummaryCard = styled(Card)`
  display: grid;
  min-height: 132px;
  align-content: space-between;
  gap: var(--space-4);
  padding: var(--space-5);

  @media (max-width: 520px) {
    min-height: 118px;
    padding: var(--space-4);
  }
`;

const CardLabel = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
  font-weight: 600;
`;

const CardIcon = styled.span<{ $tone?: "danger" | "success" | "warning" }>`
  display: grid;
  width: 2rem;
  height: 2rem;
  place-items: center;
  border-radius: var(--radius-md);
  background: ${({ $tone }) =>
    $tone === "danger"
      ? "var(--color-danger-50)"
      : $tone === "success"
        ? "var(--color-success-50)"
        : $tone === "warning"
          ? "var(--color-warning-50)"
          : "var(--color-primary-50)"};
  color: ${({ $tone }) =>
    $tone === "danger"
      ? "var(--color-danger-600)"
      : $tone === "success"
        ? "var(--color-success-600)"
        : $tone === "warning"
          ? "var(--color-warning-600)"
          : "var(--color-primary-600)"};
  font-size: var(--font-size-xs);
  font-weight: 800;
`;

const CardValue = styled.strong<{ $tone?: "danger" | "success" | "warning" }>`
  display: block;
  color: ${({ $tone }) =>
    $tone === "danger"
      ? "var(--color-danger-600)"
      : $tone === "success"
        ? "var(--color-success-600)"
        : $tone === "warning"
          ? "var(--color-warning-600)"
          : "var(--color-text)"};
  font-size: var(--font-size-2xl);
  font-variant-numeric: tabular-nums;
  line-height: var(--line-height-tight);
`;

const CardHint = styled.span`
  display: block;
  margin-top: var(--space-2);
  color: var(--color-text-subtle);
  font-size: var(--font-size-xs);
`;

const StatusBadge = styled.span<{ $locked: boolean }>`
  display: inline-flex;
  width: fit-content;
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-full);
  background: ${({ $locked }) =>
    $locked ? "var(--color-warning-50)" : "var(--color-success-50)"};
  color: ${({ $locked }) =>
    $locked ? "var(--color-warning-600)" : "var(--color-success-600)"};
  font-size: var(--font-size-sm);
  font-weight: 750;
`;

const MainGrid = styled.div`
  display: grid;
  min-width: 0;
  min-height: 280px;
  flex: 1;
  grid-template-columns: minmax(0, 1.8fr) minmax(300px, 0.75fr);
  align-items: stretch;
  gap: var(--space-5);

  @media (max-width: 960px) {
    min-height: auto;
    flex: none;
    grid-template-columns: 1fr;
  }
`;

const OverviewRail = styled.aside`
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: var(--space-5);
  align-self: start;
`;

const SectionCard = styled(Card)`
  display: flex;
  min-width: 0;
  height: 100%;
  flex-direction: column;
  overflow: hidden;
  padding: 0;
`;

const SectionHeader = styled.div`
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

  p {
    margin: 0;
    color: var(--color-text-muted);
    font-size: var(--font-size-sm);
  }
`;

const TextLink = styled(Link)`
  flex: 0 0 auto;
  color: var(--color-primary-600);
  font-size: var(--font-size-sm);
  font-weight: 650;
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
`;

const TableScroll = styled.div`
  flex: 1;
  overflow-x: auto;
`;

const Table = styled.table`
  width: 100%;
  min-width: 620px;
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

  th:not(:first-child),
  td:not(:first-child) {
    text-align: right;
  }

  tbody tr:last-child td {
    border-bottom: 0;
  }
`;

const CategoryCell = styled.div`
  display: flex;
  min-width: 150px;
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
  font-size: var(--font-size-xs);
  font-weight: 800;
`;

const NumericValue = styled.span`
  font-variant-numeric: tabular-nums;
`;

const VarianceValue = styled(NumericValue)<{ $value: number }>`
  color: ${({ $value }) =>
    $value > 0
      ? "var(--color-danger-600)"
      : $value < 0
        ? "var(--color-success-600)"
        : "var(--color-text-muted)"};
  font-weight: 650;
`;

const ProgressCard = styled(Card)`
  padding: var(--space-6);

  h2 {
    margin-bottom: var(--space-2);
    font-size: var(--font-size-lg);
  }

  > p {
    margin-bottom: var(--space-5);
    color: var(--color-text-muted);
    font-size: var(--font-size-sm);
  }
`;

const ProgressSummary = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--space-3);
  margin-bottom: var(--space-3);

  strong {
    font-size: var(--font-size-xl);
  }

  span {
    color: var(--color-text-muted);
    font-size: var(--font-size-sm);
  }
`;

const ProgressTrack = styled.div`
  overflow: hidden;
  height: 0.65rem;
  border-radius: var(--radius-full);
  background: var(--color-border);
`;

const ProgressFill = styled.div<{ $percent: number; $over: boolean }>`
  width: ${({ $percent }) => `${Math.min($percent, 100)}%`};
  height: 100%;
  border-radius: inherit;
  background: ${({ $over }) =>
    $over ? "var(--color-danger-600)" : "var(--color-primary-600)"};
  transition: width 250ms ease;
`;

const ProgressHint = styled.p`
  margin: var(--space-3) 0 0 !important;
  color: var(--color-text-subtle) !important;
  font-size: var(--font-size-xs) !important;
`;

const QuickActionsCard = styled(Card)`
  padding: var(--space-6);

  h2 {
    margin-bottom: var(--space-4);
    font-size: var(--font-size-lg);
  }
`;

const QuickActions = styled.div`
  display: grid;
  gap: var(--space-3);

  @media (min-width: 961px) {
    grid-template-columns: 1fr;
  }

  @media (min-width: 521px) and (max-width: 960px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (max-width: 520px) {
    grid-template-columns: 1fr;
  }
`;

const QuickAction = styled(Link)`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  color: var(--color-text);
  font-size: var(--font-size-sm);
  font-weight: 650;
  text-decoration: none;

  span:last-child {
    color: var(--color-primary-600);
  }

  &:hover {
    border-color: var(--color-primary-500);
    background: var(--color-primary-50);
  }
`;

const EmptyState = styled.div`
  display: grid;
  flex: 1;
  align-content: center;
  justify-items: center;
  gap: var(--space-3);
  padding: var(--space-12) var(--space-6);
  color: var(--color-text-muted);
  text-align: center;

  h3 {
    margin: 0;
    color: var(--color-text);
    font-size: var(--font-size-lg);
  }

  p {
    max-width: 480px;
    margin: 0;
  }
`;

const EmptyActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: var(--space-3);
  margin-top: var(--space-2);
`;

const PrimaryLink = styled(Link)`
  padding: 0.7rem 1rem;
  border-radius: var(--radius-md);
  background: var(--color-primary-600);
  color: #ffffff;
  font-size: var(--font-size-sm);
  font-weight: 650;
  text-decoration: none;
`;

const SecondaryLink = styled(PrimaryLink)`
  border: 1px solid var(--color-border-strong);
  background: var(--color-surface);
  color: var(--color-text);
`;

const LoadingCard = styled(Card)`
  flex: 1;
  padding: var(--space-12);
  color: var(--color-text-muted);
  text-align: center;
`;

const currentMonth = () => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
};

const formatMonth = (month: string) => {
  const [year, monthNumber] = month.split("-").map(Number);
  return new Intl.DateTimeFormat("en", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, monthNumber - 1, 1)));
};

const getSortedRows = (rows: ReportRow[]) =>
  [...rows].sort(
    (first, second) =>
      second.actual - first.actual ||
      first.categoryName.localeCompare(second.categoryName),
  );

export function DashboardPage() {
  const { user } = useAuth();
  const { formatAmount, formatSignedAmount } = useCurrency();
  const [month, setMonth] = useState(currentMonth);
  const [report, setReport] = useState<ReportResponse | null>(null);
  const [locks, setLocks] = useState<PeriodLock[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isActive = true;

    Promise.all([
      reportService.getPlanVsActual({ startMonth: month, endMonth: month }),
      periodLockService.getAll(),
      categoryService.getAll(),
    ])
      .then(([reportResult, lockResult, categoryResult]) => {
        if (!isActive) return;
        setReport(reportResult);
        setLocks(lockResult);
        setCategories(categoryResult);
      })
      .catch((requestError) => {
        if (isActive) {
          setError(getApiErrorMessage(requestError, "Unable to load overview."));
        }
      })
      .finally(() => {
        if (isActive) setIsLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, [month]);

  const rows = useMemo(
    () => getSortedRows(report?.rows ?? []),
    [report],
  );
  const summary = report?.summary;
  const isLocked = locks.some((lock) => lock.month === month);
  const remaining = (summary?.totalPlan ?? 0) - (summary?.totalActual ?? 0);
  const isOverBudget = remaining < 0;
  const utilization = summary?.totalPlan
    ? (summary.totalActual / summary.totalPlan) * 100
    : summary?.totalActual
      ? 100
      : 0;

  return (
    <OverviewShell>
      <PageHeader
        title="Overview"
        description={`Welcome back, ${user?.name.split(" ")[0] ?? "there"}. Here is your spending position for ${formatMonth(month)}.`}
        action={
          <MonthField>
            <label htmlFor="overview-month">Viewing month</label>
            <MonthInput
              id="overview-month"
              type="month"
              value={month}
              onInput={(event) => {
                setIsLoading(true);
                setError("");
                setMonth(event.currentTarget.value);
              }}
            />
          </MonthField>
        }
      />

      {error ? <ErrorBanner role="alert">{error}</ErrorBanner> : null}

      {isLoading ? (
        <LoadingCard>Loading your financial overview...</LoadingCard>
      ) : report && summary ? (
        <>
          <SummaryGrid>
            <SummaryCard>
              <CardLabel>
                Planned
                <CardIcon><AppIcon name="target" size={16} /></CardIcon>
              </CardLabel>
              <div>
                <CardValue>{formatAmount(summary.totalPlan)}</CardValue>
                <CardHint>Monthly spending target</CardHint>
              </div>
            </SummaryCard>

            <SummaryCard>
              <CardLabel>
                Actual spent
                <CardIcon $tone={isOverBudget ? "danger" : undefined}>
                  <AppIcon name="wallet" size={16} />
                </CardIcon>
              </CardLabel>
              <div>
                <CardValue $tone={isOverBudget ? "danger" : undefined}>
                  {formatAmount(summary.totalActual)}
                </CardValue>
                <CardHint>{rows.reduce((sum, row) => sum + row.actualEntryCount, 0)} recorded entries</CardHint>
              </div>
            </SummaryCard>

            <SummaryCard>
              <CardLabel>
                {isOverBudget ? "Over budget" : "Remaining"}
                <CardIcon $tone={isOverBudget ? "danger" : "success"}>
                  <AppIcon name="variance" size={16} />
                </CardIcon>
              </CardLabel>
              <div>
                <CardValue $tone={isOverBudget ? "danger" : "success"}>
                  {formatAmount(Math.abs(remaining))}
                </CardValue>
                <CardHint>
                  Variance {formatSignedAmount(summary.totalVariance)}
                </CardHint>
              </div>
            </SummaryCard>

            <SummaryCard>
              <CardLabel>
                Period status
                <CardIcon $tone={isLocked ? "warning" : "success"}>
                  <AppIcon name={isLocked ? "lock" : "unlock"} size={16} />
                </CardIcon>
              </CardLabel>
              <div>
                <StatusBadge $locked={isLocked}>
                  {isLocked ? "Locked" : "Open"}
                </StatusBadge>
                <CardHint>
                  {isLocked ? "Read-only period" : `${categories.length} categories available`}
                </CardHint>
              </div>
            </SummaryCard>
          </SummaryGrid>

          <MainGrid>
            <SectionCard>
              <SectionHeader>
                <div>
                  <h2>Category performance</h2>
                  <p>Actual minus plan for each active category.</p>
                </div>
                <TextLink to={`/dashboard/report`}>Full report</TextLink>
              </SectionHeader>

              {rows.length === 0 ? (
                <EmptyState>
                  <h3>No activity for {formatMonth(month)}</h3>
                  <p>
                    Add a monthly plan and record actual spending to see your comparison here.
                  </p>
                  <EmptyActions>
                    <PrimaryLink to="/dashboard/plans">Create a plan</PrimaryLink>
                    <SecondaryLink to="/dashboard/actuals">Record an actual</SecondaryLink>
                  </EmptyActions>
                </EmptyState>
              ) : (
                <TableScroll>
                  <Table>
                    <thead>
                      <tr>
                        <th>Category</th>
                        <th>Plan</th>
                        <th>Actual</th>
                        <th>Variance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row) => (
                        <tr key={row.categoryId}>
                          <td>
                            <CategoryCell>
                              <CategoryMark><AppIcon name="category" size={15} /></CategoryMark>
                              {row.categoryName}
                            </CategoryCell>
                          </td>
                          <td><NumericValue>{formatAmount(row.plan)}</NumericValue></td>
                          <td><NumericValue>{formatAmount(row.actual)}</NumericValue></td>
                          <td>
                            <VarianceValue $value={row.variance}>
                              {formatSignedAmount(row.variance)}
                            </VarianceValue>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </TableScroll>
              )}
            </SectionCard>

            <OverviewRail>
              <ProgressCard>
                <h2>Budget used</h2>
                <p>Progress against this month&apos;s planned total.</p>
                <ProgressSummary>
                  <strong>{summary.totalPlan ? `${utilization.toFixed(1)}%` : "—"}</strong>
                  <span>{formatAmount(summary.totalActual)} / {formatAmount(summary.totalPlan)}</span>
                </ProgressSummary>
                <ProgressTrack>
                  <ProgressFill $percent={utilization} $over={isOverBudget} />
                </ProgressTrack>
                <ProgressHint>
                  {summary.totalPlan === 0
                    ? "Create a plan to calculate budget usage."
                    : isOverBudget
                      ? "Spending has exceeded the monthly plan."
                      : `${formatAmount(remaining)} remains in the plan.`}
                </ProgressHint>
              </ProgressCard>

              <QuickActionsCard>
                <h2>Quick actions</h2>
                <QuickActions>
                  <QuickAction to="/dashboard/plans">
                    <span>Manage plans</span><span>→</span>
                  </QuickAction>
                  <QuickAction to="/dashboard/actuals">
                    <span>Record spending</span><span>→</span>
                  </QuickAction>
                  <QuickAction to="/dashboard/report">
                    <span>Open full report</span><span>→</span>
                  </QuickAction>
                  <QuickAction to="/dashboard/period-locks">
                    <span>Manage period</span><span>→</span>
                  </QuickAction>
                </QuickActions>
              </QuickActionsCard>
            </OverviewRail>
          </MainGrid>
        </>
      ) : null}
    </OverviewShell>
  );
}
