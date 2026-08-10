import { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import { Button } from "../components/common/Button";
import { Card } from "../components/common/Card";
import { ConfirmDialog } from "../components/common/ConfirmDialog";
import { PageHeader } from "../components/common/PageHeader";
import {
  SkeletonCard,
  SkeletonPulse,
  SkeletonRow,
} from "../components/common/Skeleton";
import { useToast } from "../hooks/useToast";
import { periodLockService } from "../services/period-lock.service";
import type { PeriodLock } from "../types/period-lock";
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

const LockCard = styled(Card)`
  display: grid;
  grid-template-columns: minmax(220px, 0.7fr) minmax(280px, 1.3fr);
  gap: var(--space-8);
  margin-bottom: var(--space-6);
  padding: var(--space-6);

  @media (max-width: 760px) {
    grid-template-columns: 1fr;
  }
`;

const MonthSection = styled.div`
  display: grid;
  align-content: start;
  gap: var(--space-4);

  h2 {
    margin: 0;
    font-size: var(--font-size-lg);
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

const MonthInput = styled.input`
  width: 100%;
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

const StatusPanel = styled.div<{ $locked: boolean }>`
  display: grid;
  align-content: center;
  gap: var(--space-3);
  padding: var(--space-6);
  border: 1px solid
    ${({ $locked }) =>
      $locked ? "rgb(220 104 3 / 24%)" : "rgb(3 152 85 / 24%)"};
  border-radius: var(--radius-lg);
  background: ${({ $locked }) =>
    $locked ? "var(--color-warning-50)" : "var(--color-success-50)"};

  h3 {
    margin: 0;
    color: ${({ $locked }) =>
      $locked ? "var(--color-warning-600)" : "var(--color-success-600)"};
    font-size: var(--font-size-xl);
  }

  p {
    margin: 0;
    color: var(--color-text-muted);
  }
`;

const ImpactCard = styled(Card)`
  margin-bottom: var(--space-6);
  padding: var(--space-6);

  h2 {
    margin-bottom: var(--space-4);
    font-size: var(--font-size-lg);
  }

  ul {
    display: grid;
    margin: 0;
    padding-left: var(--space-5);
    gap: var(--space-2);
    color: var(--color-text-muted);
  }

  strong {
    color: var(--color-text);
  }
`;

const PermanentNotice = styled.div`
  margin-top: var(--space-5);
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-md);
  background: var(--color-warning-50);
  color: var(--color-warning-600);
  font-size: var(--font-size-sm);
  font-weight: 650;
`;

const TableCard = styled(Card)`
  overflow: hidden;
  padding: 0;
`;

const TableHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  padding: var(--space-5) var(--space-6);
  border-bottom: 1px solid var(--color-border);

  h2 {
    margin: 0;
    font-size: var(--font-size-lg);
  }

  span {
    color: var(--color-text-muted);
    font-size: var(--font-size-sm);
  }
`;

const TableScroll = styled.div`
  overflow-x: auto;
`;

const Table = styled.table`
  width: 100%;
  min-width: 560px;
  border-collapse: collapse;

  th,
  td {
    padding: var(--space-4) var(--space-6);
    border-bottom: 1px solid var(--color-border);
    text-align: left;
  }

  th {
    background: var(--color-surface-subtle);
    color: var(--color-text-muted);
    font-size: var(--font-size-xs);
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  tbody tr:last-child td {
    border-bottom: 0;
  }
`;

const LockedBadge = styled.span`
  display: inline-flex;
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-full);
  background: var(--color-warning-50);
  color: var(--color-warning-600);
  font-size: var(--font-size-xs);
  font-weight: 700;
`;

const EmptyState = styled.div`
  padding: var(--space-12) var(--space-6);
  color: var(--color-text-muted);
  text-align: center;

  h3 {
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
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, monthNumber - 1, 1)));
};

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));

const sortLocks = (locks: PeriodLock[]) =>
  [...locks].sort((first, second) => second.month.localeCompare(first.month));

export function PeriodLocksPage() {
  const toast = useToast();
  const [month, setMonth] = useState(currentMonth);
  const [locks, setLocks] = useState<PeriodLock[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [monthToLock, setMonthToLock] = useState<string | null>(null);
  const [isLocking, setIsLocking] = useState(false);

  useEffect(() => {
    let isActive = true;

    periodLockService
      .getAll()
      .then((result) => {
        if (isActive) setLocks(sortLocks(result));
      })
      .catch((requestError) => {
        if (isActive) {
          setError(getApiErrorMessage(requestError, "Unable to load period locks."));
        }
      })
      .finally(() => {
        if (isActive) setIsLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, []);

  const selectedLock = useMemo(
    () => locks.find((lock) => lock.month === month),
    [locks, month],
  );

  const handleLock = async () => {
    if (!monthToLock) return;

    try {
      setIsLocking(true);
      setError("");
      const lock = await periodLockService.lock(monthToLock);
      setLocks((current) =>
        sortLocks([
          ...current.filter((item) => item.month !== lock.month),
          lock,
        ]),
      );
      setMonthToLock(null);
      toast.success(`${formatMonth(lock.month)} locked successfully.`);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, "Unable to lock this month."));
      setMonthToLock(null);
    } finally {
      setIsLocking(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Period Locks"
        description="Close completed months so their Plans and Actual entries remain unchanged."
      />

      {error ? <ErrorBanner role="alert">{error}</ErrorBanner> : null}

      <LockCard>
        <MonthSection>
          <h2>Month status</h2>
          <Field>
            <label htmlFor="lock-month">Select month</label>
            <MonthInput
              id="lock-month"
              type="month"
              value={month}
              onInput={(event) => setMonth(event.currentTarget.value)}
            />
          </Field>
          <Button
            variant={selectedLock ? "secondary" : "danger"}
            disabled={Boolean(selectedLock) || isLoading}
            onClick={() => setMonthToLock(month)}
          >
            {selectedLock ? "Month is locked" : `Lock ${formatMonth(month)}`}
          </Button>
        </MonthSection>

        <StatusPanel $locked={Boolean(selectedLock)}>
          <h3>{selectedLock ? "Locked" : "Open"}</h3>
          <p>
            {selectedLock
              ? `${formatMonth(month)} is read-only. Reports remain available.`
              : `${formatMonth(month)} can still receive Plan and Actual changes.`}
          </p>
          {selectedLock ? (
            <small>Locked on {formatDate(selectedLock.lockedAt)}</small>
          ) : null}
        </StatusPanel>
      </LockCard>

      <ImpactCard>
        <h2>What happens when a month is locked?</h2>
        <ul>
          <li><strong>Plans</strong> cannot be created, edited, or deleted.</li>
          <li><strong>Actuals</strong> cannot be created, edited, or deleted.</li>
          <li><strong>Reports</strong> remain available and show the month as locked.</li>
          <li>Other open months continue to work normally.</li>
        </ul>
        <PermanentNotice>
          Locking is permanent in the current version because the backend does not provide an unlock operation.
        </PermanentNotice>
      </ImpactCard>

      <TableCard>
        <TableHeader>
          <h2>Locked months</h2>
          <span>{locks.length} total</span>
        </TableHeader>

        {isLoading ? (
          <SkeletonCard>
            <SkeletonRow>
              <SkeletonPulse $height="0.85rem" />
              <SkeletonPulse $height="0.85rem" />
              <SkeletonPulse $height="0.85rem" />
            </SkeletonRow>
            <SkeletonRow>
              <SkeletonPulse $height="0.85rem" />
              <SkeletonPulse $height="0.85rem" />
              <SkeletonPulse $height="0.85rem" />
            </SkeletonRow>
            <SkeletonRow>
              <SkeletonPulse $height="0.85rem" />
              <SkeletonPulse $height="0.85rem" />
              <SkeletonPulse $height="0.85rem" />
            </SkeletonRow>
          </SkeletonCard>
        ) : locks.length === 0 ? (
          <EmptyState>
            <h3>No locked months</h3>
            <p>Completed periods will appear here after you lock them.</p>
          </EmptyState>
        ) : (
          <TableScroll>
            <Table>
              <thead>
                <tr>
                  <th>Month</th>
                  <th>Locked on</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {locks.map((lock) => (
                  <tr key={lock.id}>
                    <td><strong>{formatMonth(lock.month)}</strong></td>
                    <td>{formatDate(lock.lockedAt)}</td>
                    <td><LockedBadge>Locked</LockedBadge></td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </TableScroll>
        )}
      </TableCard>

      {monthToLock ? (
        <ConfirmDialog
          title={`Lock ${formatMonth(monthToLock)}?`}
          description="Plans and Actuals for this month will become read-only. This cannot be undone in the current version."
          confirmLabel="Lock month"
          confirmingLabel="Locking..."
          isConfirming={isLocking}
          onCancel={() => setMonthToLock(null)}
          onConfirm={() => void handleLock()}
        />
      ) : null}
    </>
  );
}
