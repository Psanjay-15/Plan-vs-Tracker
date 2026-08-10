import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import styled from "styled-components";
import { AppIcon } from "../components/common/AppIcon";
import { Card } from "../components/common/Card";
import { PageHeader } from "../components/common/PageHeader";
import {
  SkeletonCard,
  SkeletonPulse,
  SkeletonRow,
} from "../components/common/Skeleton";
import { useAuth } from "../hooks/useAuth";
import { useCurrency } from "../hooks/useCurrency";
import { actualService } from "../services/actual.service";
import { categoryService } from "../services/category.service";
import { periodLockService } from "../services/period-lock.service";
import { reportService } from "../services/report.service";
import type { Actual } from "../types/actual";
import type { Category } from "../types/category";
import type { PeriodLock } from "../types/period-lock";
import type { ReportResponse, ReportRow } from "../types/report";
import { getApiErrorMessage } from "../utils/getApiErrorMessage";

const OverviewShell = styled.div`
  display: flex;
  height: 100%;
  max-height: 100%;
  flex: 1;
  flex-direction: column;
  gap: var(--space-3);
  overflow: hidden;

  > header {
    flex: 0 0 auto;
    margin-bottom: 0;
    gap: var(--space-4);

    h1 {
      margin-bottom: 0.15rem;
      font-size: var(--font-size-2xl);
    }

    p {
      font-size: var(--font-size-sm);
    }
  }

  @media (max-width: 960px) {
    height: auto;
    max-height: none;
    overflow: visible;
  }
`;

const OverviewBody = styled.div`
  display: flex;
  min-height: 0;
  flex: 1;
  flex-direction: column;
  gap: var(--space-3);
`;

const MonthField = styled.div`
  display: grid;
  gap: 0.35rem;

  label {
    color: var(--color-text-muted);
    font-size: var(--font-size-xs);
    font-weight: 700;
    letter-spacing: 0.03em;
    text-transform: uppercase;
  }
`;

const MonthInput = styled.input`
  min-height: 2.4rem;
  padding: 0.5rem 0.7rem;
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
  flex: 0 0 auto;
  padding: var(--space-2) var(--space-3);
  border: 1px solid rgb(217 45 32 / 28%);
  border-radius: var(--radius-md);
  background: var(--color-danger-50);
  color: var(--color-danger-600);
  font-size: var(--font-size-sm);
`;

const AssistantSpotlight = styled.section`
  position: relative;
  overflow: hidden;
  display: grid;
  flex: 0 0 auto;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: var(--space-4);
  padding: 0.85rem 1rem 0.85rem 1.15rem;
  border: 1px solid rgb(185 79 39 / 28%);
  border-radius: var(--radius-lg);
  background:
    radial-gradient(circle at 92% 18%, rgb(255 228 207 / 88%), transparent 34%),
    linear-gradient(135deg, #fff8f2 0%, #ffe8d8 48%, #f7d7c2 100%);
  box-shadow: 0 8px 20px rgb(146 70 34 / 8%);

  &::before {
    content: "";
    position: absolute;
    inset: 0 auto 0 0;
    width: 4px;
    background: linear-gradient(
      180deg,
      var(--color-primary-500),
      var(--color-primary-700)
    );
  }

  @media (max-width: 760px) {
    grid-template-columns: 1fr;
    gap: var(--space-3);
  }
`;

const AssistantCopy = styled.div`
  display: grid;
  gap: 0.35rem;
  min-width: 0;

  h2 {
    margin: 0;
    font-size: var(--font-size-lg);
    font-weight: 750;
    line-height: var(--line-height-tight);
    color: var(--color-primary-700);
  }

  p {
    margin: 0;
    max-width: 44rem;
    color: var(--color-text-muted);
    font-size: var(--font-size-xs);
    line-height: 1.45;
  }
`;

const AssistantEyebrow = styled.span`
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  width: fit-content;
  padding: 0.2rem 0.55rem;
  border-radius: var(--radius-full);
  background: rgb(185 79 39 / 12%);
  color: var(--color-primary-700);
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
`;

const AssistantActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: var(--space-2);
`;

const AssistantPrimaryLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: 0.65rem 0.95rem;
  border-radius: var(--radius-md);
  background: linear-gradient(
    145deg,
    var(--color-primary-500),
    var(--color-primary-700)
  );
  color: #ffffff;
  font-size: var(--font-size-sm);
  font-weight: 700;
  text-decoration: none;
  box-shadow: 0 6px 14px rgb(146 70 34 / 20%);
  white-space: nowrap;

  &:hover {
    box-shadow: 0 8px 18px rgb(146 70 34 / 26%);
  }
`;

const PromptChips = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  margin-top: 0.15rem;
`;

const PromptChip = styled(Link)`
  padding: 0.28rem 0.55rem;
  border: 1px solid rgb(185 79 39 / 22%);
  border-radius: var(--radius-full);
  background: rgb(255 253 249 / 78%);
  color: var(--color-primary-700);
  font-size: 0.7rem;
  font-weight: 650;
  text-decoration: none;

  &:hover {
    background: #ffffff;
    border-color: var(--color-primary-500);
  }
`;

const SummaryGrid = styled.div`
  display: grid;
  flex: 0 0 auto;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--space-3);

  @media (max-width: 1000px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (max-width: 380px) {
    grid-template-columns: 1fr;
  }
`;

const OverviewSkeleton = styled.div`
  display: flex;
  min-height: 0;
  flex: 1;
  flex-direction: column;
  gap: var(--space-3);
`;

const SkeletonSummaryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--space-3);

  @media (max-width: 1000px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`;

const SummaryCard = styled(Card)`
  display: grid;
  min-height: 0;
  align-content: space-between;
  gap: var(--space-2);
  padding: 0.85rem 1rem;

  @media (max-width: 520px) {
    padding: var(--space-3);
  }
`;

const CardLabel = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  color: var(--color-text-muted);
  font-size: var(--font-size-xs);
  font-weight: 600;
`;

const CardIcon = styled.span<{ $tone?: "danger" | "success" | "warning" }>`
  display: grid;
  width: 1.65rem;
  height: 1.65rem;
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
  font-size: var(--font-size-xl);
  font-variant-numeric: tabular-nums;
  line-height: var(--line-height-tight);
`;

const CardHint = styled.span`
  display: block;
  margin-top: 0.2rem;
  color: var(--color-text-subtle);
  font-size: 0.7rem;
`;

const StatusBadge = styled.span<{ $locked: boolean }>`
  display: inline-flex;
  width: fit-content;
  padding: 0.15rem 0.45rem;
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
  min-height: 0;
  flex: 1;
  grid-template-columns: minmax(0, 1.8fr) minmax(260px, 0.75fr);
  align-items: stretch;
  gap: var(--space-3);

  @media (max-width: 960px) {
    min-height: auto;
    flex: none;
    grid-template-columns: 1fr;
  }
`;

const OverviewRail = styled.aside`
  display: flex;
  min-width: 0;
  min-height: 0;
  flex-direction: column;
  gap: var(--space-3);
`;

const SectionCard = styled(Card)`
  display: flex;
  min-width: 0;
  min-height: 0;
  height: 100%;
  flex-direction: column;
  overflow: hidden;
  padding: 0;
`;

const SectionHeader = styled.div`
  display: flex;
  flex: 0 0 auto;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-3);
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--color-border);

  h2 {
    margin: 0 0 0.15rem;
    font-size: var(--font-size-md);
  }

  p {
    margin: 0;
    color: var(--color-text-muted);
    font-size: var(--font-size-xs);
  }
`;

const TextLink = styled(Link)`
  flex: 0 0 auto;
  color: var(--color-primary-600);
  font-size: var(--font-size-xs);
  font-weight: 650;
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
`;

const TableScroll = styled.div`
  flex: 1;
  min-height: 0;
  overflow: auto;
`;

const Table = styled.table`
  width: 100%;
  min-width: 520px;
  border-collapse: collapse;

  th,
  td {
    padding: 0.65rem 0.9rem;
    border-bottom: 1px solid var(--color-border);
    text-align: left;
    vertical-align: middle;
    font-size: var(--font-size-sm);
  }

  th {
    position: sticky;
    top: 0;
    z-index: 1;
    background: var(--color-surface-subtle);
    color: var(--color-text-muted);
    font-size: 0.68rem;
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
  min-width: 120px;
  align-items: center;
  gap: var(--space-2);
  font-weight: 650;
`;

const CategoryMark = styled.span`
  display: grid;
  width: 1.65rem;
  height: 1.65rem;
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
  flex: 0 0 auto;
  padding: 0.85rem 1rem;

  h2 {
    margin-bottom: 0.2rem;
    font-size: var(--font-size-md);
  }

  > p {
    margin-bottom: var(--space-3);
    color: var(--color-text-muted);
    font-size: var(--font-size-xs);
  }
`;

const ProgressSummary = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--space-3);
  margin-bottom: var(--space-2);

  strong {
    font-size: var(--font-size-lg);
  }

  span {
    color: var(--color-text-muted);
    font-size: var(--font-size-xs);
  }
`;

const ProgressTrack = styled.div`
  overflow: hidden;
  height: 0.5rem;
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
  margin: var(--space-2) 0 0 !important;
  color: var(--color-text-subtle) !important;
  font-size: 0.7rem !important;
`;

const ActivityCard = styled(Card)`
  display: flex;
  min-height: 0;
  flex: 1 1 auto;
  flex-direction: column;
  padding: 0.85rem 1rem;
  overflow: hidden;

  h2 {
    flex: 0 0 auto;
    margin-bottom: var(--space-2);
    font-size: var(--font-size-md);
  }
`;

const ActivityList = styled.div`
  display: grid;
  min-height: 0;
  flex: 1;
  align-content: start;
  gap: 0.45rem;
  overflow: auto;
`;

const ActivityItem = styled.div`
  display: grid;
  gap: 0.1rem;
  padding: 0.5rem 0.65rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface-subtle);

  strong {
    font-size: var(--font-size-xs);
  }

  span {
    color: var(--color-text-muted);
    font-size: 0.7rem;
  }
`;

const EmptyState = styled.div`
  display: grid;
  flex: 1;
  align-content: center;
  justify-items: center;
  gap: var(--space-2);
  padding: var(--space-6) var(--space-4);
  color: var(--color-text-muted);
  text-align: center;

  h3 {
    margin: 0;
    color: var(--color-text);
    font-size: var(--font-size-md);
  }

  p {
    max-width: 420px;
    margin: 0;
    font-size: var(--font-size-sm);
  }
`;

const EmptyActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: var(--space-2);
  margin-top: var(--space-1);
`;

const PrimaryLink = styled(Link)`
  padding: 0.55rem 0.85rem;
  border-radius: var(--radius-md);
  background: var(--color-primary-600);
  color: #ffffff;
  font-size: var(--font-size-xs);
  font-weight: 650;
  text-decoration: none;
`;

const SecondaryLink = styled(PrimaryLink)`
  border: 1px solid var(--color-border-strong);
  background: var(--color-surface);
  color: var(--color-text);
`;

const formatShortDate = (value: string) =>
  new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));

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
  const [recentActuals, setRecentActuals] = useState<Actual[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isActive = true;

    Promise.all([
      reportService.getPlanVsActual({ startMonth: month, endMonth: month }),
      periodLockService.getAll(),
      categoryService.getAll(),
      actualService.getAll(),
    ])
      .then(([reportResult, lockResult, categoryResult, actualResult]) => {
        if (!isActive) return;
        setReport(reportResult);
        setLocks(lockResult);
        setCategories(categoryResult);
        setRecentActuals(
          [...actualResult]
            .sort(
              (first, second) =>
                new Date(second.createdAt).getTime() -
                new Date(first.createdAt).getTime(),
            )
            .slice(0, 20),
        );
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
  const categoryNames = useMemo(
    () => new Map(categories.map((category) => [category.id, category.name])),
    [categories],
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

  const recentActivity = useMemo(() => {
    const actualItems = recentActuals.map((actual) => ({
      id: `actual-${actual.id}`,
      title: `${categoryNames.get(actual.categoryId) ?? "Category"} · ${formatAmount(actual.amount)}`,
      detail: `${formatMonth(actual.month)}${actual.note ? ` · ${actual.note}` : ""}`,
      at: actual.createdAt,
    }));

    const lockItems = [...locks]
      .sort(
        (first, second) =>
          new Date(second.lockedAt).getTime() - new Date(first.lockedAt).getTime(),
      )
      .slice(0, 20)
      .map((lock) => ({
        id: `lock-${lock.id}`,
        title: `Locked ${formatMonth(lock.month)}`,
        detail: "Period closed for edits",
        at: lock.lockedAt,
      }));

    return [...actualItems, ...lockItems]
      .sort(
        (first, second) =>
          new Date(second.at).getTime() - new Date(first.at).getTime(),
      )
      .slice(0, 20);
  }, [categoryNames, formatAmount, locks, recentActuals]);

  return (
    <OverviewShell>
      <PageHeader
        title="Overview"
        description={`Welcome back, ${user?.name.split(" ")[0] ?? "there"}. Spending for ${formatMonth(month)}.`}
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

      <AssistantSpotlight aria-label="Ask your data assistant">
        <AssistantCopy>
          <AssistantEyebrow>
            <AppIcon name="assistant" size={12} />
            Ask your data
          </AssistantEyebrow>
          <h2>Ask AI about plans, actuals, and categories</h2>
          <p>
            Compare spending or make changes in plain language. Writes always need your confirmation.
          </p>
          <PromptChips>
            <PromptChip to="/dashboard/assistant">Compare this month</PromptChip>
            <PromptChip to="/dashboard/assistant">Create a category</PromptChip>
            <PromptChip to="/dashboard/assistant">Record spending</PromptChip>
          </PromptChips>
        </AssistantCopy>

        <div>
          <AssistantActions>
            <AssistantPrimaryLink to="/dashboard/assistant">
              <AppIcon name="assistant" size={15} />
              Open Ask AI
            </AssistantPrimaryLink>
          </AssistantActions>
        </div>
      </AssistantSpotlight>

      {isLoading ? (
        <OverviewSkeleton>
          <SkeletonSummaryGrid>
            {Array.from({ length: 4 }).map((_, index) => (
              <SkeletonCard key={index}>
                <SkeletonPulse $height="0.75rem" $width="40%" />
                <SkeletonPulse $height="1.5rem" $width="70%" />
                <SkeletonPulse $height="0.7rem" $width="55%" />
              </SkeletonCard>
            ))}
          </SkeletonSummaryGrid>
          <SkeletonCard style={{ flex: 1 }}>
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
            <SkeletonRow>
              <SkeletonPulse $height="0.85rem" />
              <SkeletonPulse $height="0.85rem" />
              <SkeletonPulse $height="0.85rem" />
              <SkeletonPulse $height="0.85rem" />
            </SkeletonRow>
          </SkeletonCard>
        </OverviewSkeleton>
      ) : report && summary ? (
        <OverviewBody>
          <SummaryGrid>
            <SummaryCard>
              <CardLabel>
                Planned
                <CardIcon><AppIcon name="target" size={14} /></CardIcon>
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
                  <AppIcon name="wallet" size={14} />
                </CardIcon>
              </CardLabel>
              <div>
                <CardValue $tone={isOverBudget ? "danger" : undefined}>
                  {formatAmount(summary.totalActual)}
                </CardValue>
                <CardHint>
                  {rows.reduce((sum, row) => sum + row.actualEntryCount, 0)} recorded entries
                </CardHint>
              </div>
            </SummaryCard>

            <SummaryCard>
              <CardLabel>
                {isOverBudget ? "Over budget" : "Remaining"}
                <CardIcon $tone={isOverBudget ? "danger" : "success"}>
                  <AppIcon name="variance" size={14} />
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
                  <AppIcon name={isLocked ? "lock" : "unlock"} size={14} />
                </CardIcon>
              </CardLabel>
              <div>
                <StatusBadge $locked={isLocked}>
                  {isLocked ? "Locked" : "Open"}
                </StatusBadge>
                <CardHint>
                  {isLocked
                    ? "Read-only period"
                    : `${categories.length} categories available`}
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
                <TextLink to="/dashboard/report">Full report</TextLink>
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
                              <CategoryMark>
                                <AppIcon name="category" size={13} />
                              </CategoryMark>
                              {row.categoryName}
                            </CategoryCell>
                          </td>
                          <td>
                            <NumericValue>{formatAmount(row.plan)}</NumericValue>
                          </td>
                          <td>
                            <NumericValue>{formatAmount(row.actual)}</NumericValue>
                          </td>
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
                  <strong>
                    {summary.totalPlan ? `${utilization.toFixed(1)}%` : "—"}
                  </strong>
                  <span>
                    {formatAmount(summary.totalActual)} / {formatAmount(summary.totalPlan)}
                  </span>
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

              <ActivityCard>
                <h2>Recent activity</h2>
                <ActivityList>
                  {recentActivity.length > 0 ? (
                    recentActivity.map((item) => (
                      <ActivityItem key={item.id}>
                        <strong>{item.title}</strong>
                        <span>
                          {item.detail} · {formatShortDate(item.at)}
                        </span>
                      </ActivityItem>
                    ))
                  ) : (
                    <ActivityItem>
                      <strong>No recent activity yet</strong>
                      <span>Record spending or lock a month to see it here.</span>
                    </ActivityItem>
                  )}
                </ActivityList>
              </ActivityCard>
            </OverviewRail>
          </MainGrid>
        </OverviewBody>
      ) : null}
    </OverviewShell>
  );
}
