import {
  Fragment,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import axios from "axios";
import styled from "styled-components";
import { AppIcon } from "../components/common/AppIcon";
import { Button } from "../components/common/Button";
import { Card } from "../components/common/Card";
import { ConfirmDialog } from "../components/common/ConfirmDialog";
import { PageHeader } from "../components/common/PageHeader";
import { useCurrency } from "../hooks/useCurrency";
import { actualService } from "../services/actual.service";
import { categoryService } from "../services/category.service";
import type { Actual, ActualCsvImportError } from "../types/actual";
import type { Category } from "../types/category";
import { downloadBlob, downloadTextFile } from "../utils/download";
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

const SuccessBanner = styled.div`
  margin-bottom: var(--space-6);
  padding: var(--space-3) var(--space-4);
  border: 1px solid rgb(18 116 74 / 24%);
  border-radius: var(--radius-md);
  background: #edf8f1;
  color: #0f6a42;
  font-size: var(--font-size-sm);
`;

const HeaderActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: var(--space-3);

  @media (max-width: 640px) {
    width: 100%;

    button {
      flex: 1 1 auto;
    }
  }
`;

const HiddenFileInput = styled.input`
  display: none;
`;

const ImportErrors = styled.ul`
  margin: var(--space-3) 0 0;
  padding-left: 1.2rem;

  li + li {
    margin-top: var(--space-1);
  }
`;

const CsvHint = styled.p`
  margin: 0 0 var(--space-6);
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);

  code {
    padding: 0.1rem 0.35rem;
    border-radius: var(--radius-sm);
    background: var(--color-surface-subtle);
    font-size: 0.92em;
  }
`;

const ACTUALS_CSV_TEMPLATE = `month,category,amount,note
2026-01,Marketing,4800,January search ads
2026-01,Payroll,20500,
2026-02,Payroll,19800,February payroll
`;

const FilterCard = styled(Card)`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: flex-end;
  gap: var(--space-5);
  margin-bottom: var(--space-6);
  padding: var(--space-5) var(--space-6);

  @media (max-width: 680px) {
    align-items: stretch;
    grid-template-columns: 1fr;
  }
`;

const FilterFields = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(190px, 240px));
  align-items: flex-end;
  gap: var(--space-4);

  @media (max-width: 560px) {
    align-items: stretch;
    grid-template-columns: 1fr;
  }
`;

const Field = styled.div`
  display: grid;
  min-width: 190px;
  gap: var(--space-2);

  label {
    font-size: var(--font-size-sm);
    font-weight: 650;
  }
`;

const Control = styled.input<{ $hasError?: boolean }>`
  width: 100%;
  min-height: 2.75rem;
  padding: 0.65rem 0.8rem;
  border: 1px solid
    ${({ $hasError }) =>
      $hasError ? "var(--color-danger-600)" : "var(--color-border-strong)"};
  border-radius: var(--radius-md);
  outline: none;
  background-color: var(--color-surface);
  color: var(--color-text);

  &:focus {
    border-color: var(--color-primary-500);
    box-shadow: var(--focus-ring);
  }
`;

const Select = styled.select<{ $hasError?: boolean }>`
  width: 100%;
  min-height: 2.75rem;
  padding: 0.65rem 2.25rem 0.65rem 0.8rem;
  border: 1px solid
    ${({ $hasError }) =>
      $hasError ? "var(--color-danger-600)" : "var(--color-border-strong)"};
  border-radius: var(--radius-md);
  outline: none;
  background-color: var(--color-surface);
  color: var(--color-text);

  &:focus {
    border-color: var(--color-primary-500);
    box-shadow: var(--focus-ring);
  }
`;

const TextArea = styled.textarea<{ $hasError?: boolean }>`
  width: 100%;
  min-height: 4.5rem;
  resize: vertical;
  padding: 0.65rem 0.8rem;
  border: 1px solid
    ${({ $hasError }) =>
      $hasError ? "var(--color-danger-600)" : "var(--color-border-strong)"};
  border-radius: var(--radius-md);
  outline: none;
  background-color: var(--color-surface);
  color: var(--color-text);

  &:focus {
    border-color: var(--color-primary-500);
    box-shadow: var(--focus-ring);
  }
`;

const Summary = styled.div`
  min-width: 190px;
  padding-left: var(--space-5);
  border-left: 1px solid var(--color-border);
  text-align: right;

  span {
    display: block;
    color: var(--color-text-muted);
    font-size: var(--font-size-xs);
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  strong {
    display: block;
    margin-top: var(--space-1);
    font-size: var(--font-size-2xl);
    line-height: var(--line-height-tight);
  }

  @media (max-width: 680px) {
    padding-top: var(--space-4);
    padding-left: 0;
    border-top: 1px solid var(--color-border);
    border-left: 0;
    text-align: left;
  }
`;

const FormCard = styled(Card)`
  margin-bottom: var(--space-6);
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

const ActualForm = styled.form`
  display: grid;
  grid-template-columns: repeat(3, minmax(170px, 1fr));
  align-items: start;
  gap: var(--space-4);

  @media (max-width: 820px) {
    grid-template-columns: 1fr 1fr;
  }

  @media (max-width: 560px) {
    grid-template-columns: 1fr;
  }
`;

const NoteField = styled(Field)`
  grid-column: 1 / span 2;

  @media (max-width: 820px) {
    grid-column: 1 / -1;
  }
`;

const FormFooter = styled.div`
  display: flex;
  grid-column: 3;
  align-self: end;
  align-items: flex-end;
  justify-content: flex-end;
  gap: var(--space-4);

  @media (max-width: 820px) {
    grid-column: 1 / -1;
  }

  @media (max-width: 560px) {
    align-items: stretch;

    button {
      width: 100%;
    }
  }
`;

const FieldMessage = styled.span<{ $error?: boolean }>`
  color: ${({ $error }) =>
    $error ? "var(--color-danger-600)" : "var(--color-text-subtle)"};
  font-size: var(--font-size-xs);
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
  min-width: 820px;
  border-collapse: collapse;

  th,
  td {
    padding: var(--space-4) var(--space-6);
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

  th:nth-child(4),
  td:nth-child(4) {
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

const Note = styled.span`
  display: block;
  max-width: 280px;
  overflow: hidden;
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const Amount = styled.strong`
  font-variant-numeric: tabular-nums;
`;

const RowActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: var(--space-2);
`;

const TextButton = styled.button<{ $danger?: boolean }>`
  padding: var(--space-2);
  border: 0;
  border-radius: var(--radius-sm);
  background: transparent;
  color: ${({ $danger }) =>
    $danger ? "var(--color-danger-600)" : "var(--color-primary-600)"};
  font-size: var(--font-size-sm);
  font-weight: 650;
  cursor: pointer;

  &:hover:not(:disabled) {
    background: ${({ $danger }) =>
      $danger ? "var(--color-danger-50)" : "var(--color-primary-50)"};
  }
`;

const EditPanel = styled.form`
  display: grid;
  gap: var(--space-3);
  padding: var(--space-4) var(--space-6);
  border-bottom: 1px solid var(--color-border);
  background: var(--color-surface-subtle);
`;

const EditFields = styled.div`
  display: grid;
  grid-template-columns: minmax(180px, 0.4fr) minmax(240px, 1fr);
  gap: var(--space-4);

  ${TextArea} {
    min-height: 2.75rem;
  }

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

const EditActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: var(--space-2);
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

const LoadingState = styled.div`
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

const parsePositiveAmount = (value: string) => {
  const normalized = value.trim();
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return null;
  const amount = Math.round(Number(normalized) * 100);
  return Number.isSafeInteger(amount) && amount > 0 ? amount : null;
};

const sortActuals = (actuals: Actual[]) =>
  [...actuals].sort((first, second) =>
    second.createdAt.localeCompare(first.createdAt),
  );

export function ActualsPage() {
  const { formatAmount } = useCurrency();
  const [month, setMonth] = useState(currentMonth);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [actuals, setActuals] = useState<Actual[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [pageSuccess, setPageSuccess] = useState("");
  const [importErrors, setImportErrors] = useState<ActualCsvImportError[]>([]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newCategoryId, setNewCategoryId] = useState("");
  const [newMonth, setNewMonth] = useState(currentMonth);
  const [newAmount, setNewAmount] = useState("");
  const [newNote, setNewNote] = useState("");
  const [formError, setFormError] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingAmount, setEditingAmount] = useState("");
  const [editingNote, setEditingNote] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [actualToDelete, setActualToDelete] = useState<Actual | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const categoryMap = useMemo(
    () => new Map(categories.map((category) => [category.id, category])),
    [categories],
  );

  const reloadActuals = async () => {
    const [categoryResult, actualResult] = await Promise.all([
      categoryService.getAll(),
      actualService.getAll({
        month,
        ...(categoryFilter ? { categoryId: categoryFilter } : {}),
      }),
    ]);
    setCategories(categoryResult);
    setActuals(sortActuals(actualResult));
  };

  useEffect(() => {
    let isActive = true;

    Promise.all([
      categoryService.getAll(),
      actualService.getAll({
        month,
        ...(categoryFilter ? { categoryId: categoryFilter } : {}),
      }),
    ])
      .then(([categoryResult, actualResult]) => {
        if (!isActive) return;
        setCategories(categoryResult);
        setActuals(sortActuals(actualResult));
      })
      .catch((error) => {
        if (isActive) {
          setPageError(getApiErrorMessage(error, "Unable to load actuals."));
        }
      })
      .finally(() => {
        if (isActive) setIsLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, [categoryFilter, month]);

  const total = actuals.reduce((sum, actual) => sum + actual.amount, 0);

  const openCreateForm = () => {
    setIsCreateOpen(true);
    setNewMonth(month);
    setNewCategoryId(categoryFilter);
    setNewAmount("");
    setNewNote("");
    setFormError("");
  };

  const handleExport = async () => {
    try {
      setIsExporting(true);
      setPageError("");
      setPageSuccess("");
      setImportErrors([]);
      const blob = await actualService.exportCsv({
        month,
        ...(categoryFilter ? { categoryId: categoryFilter } : {}),
      });
      downloadBlob(blob, `actuals-${month}.csv`);
      setPageSuccess(`Exported ${actuals.length} actual entr${actuals.length === 1 ? "y" : "ies"} for ${formatMonth(month)}.`);
    } catch (error) {
      setPageError(getApiErrorMessage(error, "Unable to export actuals CSV."));
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadTemplate = () => {
    downloadTextFile(ACTUALS_CSV_TEMPLATE, "actuals-template.csv");
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleImportFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    try {
      setIsImporting(true);
      setPageError("");
      setPageSuccess("");
      setImportErrors([]);
      const csv = await file.text();
      const result = await actualService.importCsv(csv);
      await reloadActuals();
      setImportErrors(result.errors ?? []);
      setPageSuccess(result.message);
    } catch (error) {
      const responseErrors = axios.isAxiosError<{ errors?: ActualCsvImportError[] }>(
        error,
      )
        ? (error.response?.data?.errors ?? [])
        : [];
      setImportErrors(responseErrors);
      setPageError(getApiErrorMessage(error, "Unable to import actuals CSV."));
    } finally {
      setIsImporting(false);
    }
  };

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const amount = parsePositiveAmount(newAmount);

    if (!newCategoryId) {
      setFormError("Choose a category");
      return;
    }
    if (!newMonth) {
      setFormError("Choose a month");
      return;
    }
    if (amount === null) {
      setFormError("Enter an amount greater than zero with up to 2 decimals");
      return;
    }
    if (newNote.trim().length > 500) {
      setFormError("Note cannot exceed 500 characters");
      return;
    }

    try {
      setIsCreating(true);
      setFormError("");
      setPageError("");
      const actual = await actualService.create({
        categoryId: newCategoryId,
        month: newMonth,
        amount,
        ...(newNote.trim() ? { note: newNote.trim() } : {}),
      });

      if (
        actual.month === month &&
        (!categoryFilter || actual.categoryId === categoryFilter)
      ) {
        setActuals((current) => sortActuals([...current, actual]));
      }
      setIsCreateOpen(false);
      setNewAmount("");
      setNewNote("");
    } catch (error) {
      setFormError(getApiErrorMessage(error, "Unable to create actual entry."));
    } finally {
      setIsCreating(false);
    }
  };

  const startEditing = (actual: Actual) => {
    setEditingId(actual.id);
    setEditingAmount((actual.amount / 100).toFixed(2));
    setEditingNote(actual.note);
    setPageError("");
  };

  const handleUpdate = async (
    event: FormEvent<HTMLFormElement>,
    actualId: string,
  ) => {
    event.preventDefault();
    const amount = parsePositiveAmount(editingAmount);

    if (amount === null) {
      setPageError("Enter an amount greater than zero with up to 2 decimals");
      return;
    }
    if (editingNote.trim().length > 500) {
      setPageError("Note cannot exceed 500 characters");
      return;
    }

    try {
      setIsUpdating(true);
      setPageError("");
      const updatedActual = await actualService.update(actualId, {
        amount,
        note: editingNote.trim(),
      });
      setActuals((current) =>
        current.map((actual) =>
          actual.id === actualId ? updatedActual : actual,
        ),
      );
      setEditingId(null);
    } catch (error) {
      setPageError(getApiErrorMessage(error, "Unable to update actual entry."));
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!actualToDelete) return;

    try {
      setIsDeleting(true);
      setPageError("");
      await actualService.remove(actualToDelete.id);
      setActuals((current) =>
        current.filter((actual) => actual.id !== actualToDelete.id),
      );
      setActualToDelete(null);
    } catch (error) {
      setPageError(getApiErrorMessage(error, "Unable to delete actual entry."));
      setActualToDelete(null);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Actuals"
        description="Record real spending and review where money was used during each month."
        action={
          <HeaderActions>
            <Button
              variant="secondary"
              disabled={isExporting || isImporting}
              onClick={handleDownloadTemplate}
            >
              CSV template
            </Button>
            <Button
              variant="secondary"
              disabled={isExporting || isImporting}
              onClick={() => void handleExport()}
            >
              {isExporting ? "Exporting..." : "Export CSV"}
            </Button>
            <Button
              variant="secondary"
              disabled={isExporting || isImporting}
              onClick={handleImportClick}
            >
              {isImporting ? "Importing..." : "Import CSV"}
            </Button>
            <Button
              disabled={isExporting || isImporting}
              onClick={isCreateOpen ? () => setIsCreateOpen(false) : openCreateForm}
            >
              {isCreateOpen ? "Close form" : "New actual"}
            </Button>
            <HiddenFileInput
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              onChange={(event) => void handleImportFile(event)}
            />
          </HeaderActions>
        }
      />

      <CsvHint>
        CSV columns: <code>month</code>, <code>category</code>, <code>amount</code>,
        optional <code>note</code>. Month must be <code>YYYY-MM</code>. Category
        names must already exist. Locked months are rejected.
      </CsvHint>

      {pageSuccess ? (
        <SuccessBanner role="status">
          {pageSuccess}
          {importErrors.length > 0 ? (
            <ImportErrors>
              {importErrors.slice(0, 8).map((item) => (
                <li key={`${item.row}-${item.message}`}>
                  Row {item.row}: {item.message}
                </li>
              ))}
              {importErrors.length > 8 ? (
                <li>…and {importErrors.length - 8} more</li>
              ) : null}
            </ImportErrors>
          ) : null}
        </SuccessBanner>
      ) : null}

      {pageError ? (
        <ErrorBanner role="alert">
          {pageError}
          {importErrors.length > 0 ? (
            <ImportErrors>
              {importErrors.slice(0, 8).map((item) => (
                <li key={`${item.row}-${item.message}`}>
                  Row {item.row}: {item.message}
                </li>
              ))}
              {importErrors.length > 8 ? (
                <li>…and {importErrors.length - 8} more</li>
              ) : null}
            </ImportErrors>
          ) : null}
        </ErrorBanner>
      ) : null}

      {isCreateOpen ? (
        <FormCard>
          <h2>Record actual spending</h2>
          <p>You can add multiple spending entries to the same category and month.</p>
          <ActualForm onSubmit={handleCreate} noValidate>
            <Field>
              <label htmlFor="actual-category">Category</label>
              <Select
                id="actual-category"
                value={newCategoryId}
                $hasError={Boolean(formError && !newCategoryId)}
                onChange={(event) => {
                  setNewCategoryId(event.target.value);
                  setFormError("");
                }}
              >
                <option value="">Select category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </Select>
            </Field>

            <Field>
              <label htmlFor="actual-month">Month</label>
              <Control
                id="actual-month"
                type="month"
                value={newMonth}
                onChange={(event) => {
                  setNewMonth(event.target.value);
                  setFormError("");
                }}
              />
            </Field>

            <Field>
              <label htmlFor="actual-amount">Amount spent</label>
              <Control
                id="actual-amount"
                inputMode="decimal"
                placeholder="0.00"
                autoFocus
                value={newAmount}
                $hasError={Boolean(formError)}
                onChange={(event) => {
                  setNewAmount(event.target.value);
                  setFormError("");
                }}
              />
              <FieldMessage>Must be greater than zero</FieldMessage>
            </Field>

            <NoteField>
              <label htmlFor="actual-note">Note (optional)</label>
              <TextArea
                id="actual-note"
                maxLength={500}
                placeholder="For example, August paid search campaign"
                value={newNote}
                onChange={(event) => {
                  setNewNote(event.target.value);
                  setFormError("");
                }}
              />
              <FieldMessage>{newNote.length}/500 characters</FieldMessage>
            </NoteField>

            <FormFooter>
              {formError ? (
                <FieldMessage $error role="alert">
                  {formError}
                </FieldMessage>
              ) : null}
              <Button type="submit" disabled={isCreating || categories.length === 0}>
                {isCreating ? "Recording..." : "Record actual"}
              </Button>
            </FormFooter>
          </ActualForm>
        </FormCard>
      ) : null}

      <FilterCard>
        <FilterFields>
          <Field>
            <label htmlFor="actual-filter-month">Month</label>
            <Control
              id="actual-filter-month"
              type="month"
              value={month}
              onChange={(event) => {
                setIsLoading(true);
                setPageError("");
                setPageSuccess("");
                setImportErrors([]);
                setMonth(event.target.value);
              }}
            />
          </Field>
          <Field>
            <label htmlFor="actual-filter-category">Category</label>
            <Select
              id="actual-filter-category"
              value={categoryFilter}
              onChange={(event) => {
                setIsLoading(true);
                setPageError("");
                setPageSuccess("");
                setImportErrors([]);
                setCategoryFilter(event.target.value);
              }}
            >
              <option value="">All categories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </Select>
          </Field>
        </FilterFields>
        <Summary>
          <span>Total actual</span>
          <strong>{formatAmount(total)}</strong>
        </Summary>
      </FilterCard>

      <TableCard>
        <TableHeader>
          <h2>{formatMonth(month)}</h2>
          <span>
            {actuals.length} {actuals.length === 1 ? "entry" : "entries"}
          </span>
        </TableHeader>

        {isLoading ? (
          <LoadingState>Loading actuals...</LoadingState>
        ) : actuals.length === 0 ? (
          <EmptyState>
            <h3>No actual spending for this month</h3>
            <p>Record an entry when spending occurs.</p>
          </EmptyState>
        ) : (
          <TableScroll>
            <Table>
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Month</th>
                  <th>Note</th>
                  <th>Amount</th>
                  <th aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {actuals.map((actual) => {
                  const category = categoryMap.get(actual.categoryId);
                  return (
                    <Fragment key={actual.id}>
                      <tr>
                        <td>
                          <CategoryName>
                            <CategoryMark>
                              <AppIcon name="category" size={15} />
                            </CategoryMark>
                            {category?.name ?? "Unknown category"}
                          </CategoryName>
                        </td>
                        <td>{formatMonth(actual.month)}</td>
                        <td>
                          <Note title={actual.note}>
                            {actual.note || "No note"}
                          </Note>
                        </td>
                        <td>
                          <Amount>{formatAmount(actual.amount)}</Amount>
                        </td>
                        <td>
                          <RowActions>
                            <TextButton onClick={() => startEditing(actual)}>
                              Edit
                            </TextButton>
                            <TextButton
                              $danger
                              onClick={() => setActualToDelete(actual)}
                            >
                              Delete
                            </TextButton>
                          </RowActions>
                        </td>
                      </tr>
                      {editingId === actual.id ? (
                        <tr>
                          <td colSpan={5}>
                            <EditPanel
                              onSubmit={(event) =>
                                void handleUpdate(event, actual.id)
                              }
                            >
                              <EditFields>
                                <Field>
                                  <label htmlFor={`edit-amount-${actual.id}`}>
                                    Amount spent
                                  </label>
                                  <Control
                                    id={`edit-amount-${actual.id}`}
                                    autoFocus
                                    inputMode="decimal"
                                    value={editingAmount}
                                    onChange={(event) =>
                                      setEditingAmount(event.target.value)
                                    }
                                  />
                                </Field>
                                <Field>
                                  <label htmlFor={`edit-note-${actual.id}`}>
                                    Note
                                  </label>
                                  <TextArea
                                    id={`edit-note-${actual.id}`}
                                    maxLength={500}
                                    value={editingNote}
                                    onChange={(event) =>
                                      setEditingNote(event.target.value)
                                    }
                                  />
                                </Field>
                              </EditFields>
                              <EditActions>
                                <Button
                                  variant="secondary"
                                  disabled={isUpdating}
                                  onClick={() => setEditingId(null)}
                                >
                                  Cancel
                                </Button>
                                <Button type="submit" disabled={isUpdating}>
                                  {isUpdating ? "Saving..." : "Save changes"}
                                </Button>
                              </EditActions>
                            </EditPanel>
                          </td>
                        </tr>
                      ) : null}
                    </Fragment>
                  );
                })}
              </tbody>
            </Table>
          </TableScroll>
        )}
      </TableCard>

      {actualToDelete ? (
        <ConfirmDialog
          title="Delete actual entry?"
          description={`The ${formatAmount(actualToDelete.amount)} ${categoryMap.get(actualToDelete.categoryId)?.name ?? "spending"} entry for ${formatMonth(actualToDelete.month)} will be permanently removed.`}
          confirmLabel="Delete actual"
          isConfirming={isDeleting}
          onCancel={() => setActualToDelete(null)}
          onConfirm={() => void handleDelete()}
        />
      ) : null}
    </>
  );
}
