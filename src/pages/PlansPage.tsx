import { useEffect, useMemo, useState, type FormEvent } from "react";
import styled from "styled-components";
import { AppIcon } from "../components/common/AppIcon";
import { Button } from "../components/common/Button";
import { Card } from "../components/common/Card";
import { ConfirmDialog } from "../components/common/ConfirmDialog";
import { PageHeader } from "../components/common/PageHeader";
import { useCurrency } from "../hooks/useCurrency";
import { categoryService } from "../services/category.service";
import { planService } from "../services/plan.service";
import type { Category } from "../types/category";
import type { Plan } from "../types/plan";
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
    color: var(--color-text);
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

const PlanForm = styled.form`
  display: grid;
  grid-template-columns: minmax(180px, 1fr) minmax(180px, 1fr) minmax(180px, 1fr) auto;
  align-items: start;
  gap: var(--space-4);

  @media (max-width: 900px) {
    grid-template-columns: 1fr 1fr;
  }

  @media (max-width: 560px) {
    grid-template-columns: 1fr;
  }
`;

const FieldMessage = styled.span<{ $error?: boolean }>`
  color: ${({ $error }) =>
    $error ? "var(--color-danger-600)" : "var(--color-text-subtle)"};
  font-size: var(--font-size-xs);
`;

const SubmitArea = styled.div`
  padding-top: 1.65rem;

  @media (max-width: 900px) {
    padding-top: 0;
  }
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
  min-width: 720px;
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

  th:nth-child(3),
  td:nth-child(3) {
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

  &:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }
`;

const InlineForm = styled.form`
  display: flex;
  justify-content: flex-end;
  gap: var(--space-2);

  ${Control} {
    width: 150px;
    min-height: 2.35rem;
    text-align: right;
  }
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

const parseAmount = (value: string) => {
  const normalized = value.trim();
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return null;
  const amount = Math.round(Number(normalized) * 100);
  return Number.isSafeInteger(amount) ? amount : null;
};

const sortPlans = (plans: Plan[], categories: Map<string, Category>) =>
  [...plans].sort((first, second) =>
    (categories.get(first.categoryId)?.name ?? "").localeCompare(
      categories.get(second.categoryId)?.name ?? "",
    ),
  );

export function PlansPage() {
  const { formatAmount } = useCurrency();
  const [month, setMonth] = useState(currentMonth);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newCategoryId, setNewCategoryId] = useState("");
  const [newMonth, setNewMonth] = useState(currentMonth);
  const [newAmount, setNewAmount] = useState("");
  const [formError, setFormError] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingAmount, setEditingAmount] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [planToDelete, setPlanToDelete] = useState<Plan | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const categoryMap = useMemo(
    () => new Map(categories.map((category) => [category.id, category])),
    [categories],
  );

  useEffect(() => {
    let isActive = true;

    Promise.all([
      categoryService.getAll(),
      planService.getAll({
        month,
        ...(categoryFilter ? { categoryId: categoryFilter } : {}),
      }),
    ])
      .then(([categoryResult, planResult]) => {
        if (!isActive) return;
        setCategories(categoryResult);
        const map = new Map(
          categoryResult.map((category) => [category.id, category]),
        );
        setPlans(sortPlans(planResult, map));
      })
      .catch((error) => {
        if (isActive) {
          setPageError(getApiErrorMessage(error, "Unable to load plans."));
        }
      })
      .finally(() => {
        if (isActive) setIsLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, [categoryFilter, month]);

  const total = plans.reduce((sum, plan) => sum + plan.amount, 0);

  const openCreateForm = () => {
    setIsCreateOpen(true);
    setNewMonth(month);
    setNewCategoryId(categoryFilter);
    setNewAmount("");
    setFormError("");
  };

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const amount = parseAmount(newAmount);

    if (!newCategoryId) {
      setFormError("Choose a category");
      return;
    }

    if (!newMonth) {
      setFormError("Choose a month");
      return;
    }

    if (amount === null) {
      setFormError("Enter a valid non-negative amount with up to 2 decimals");
      return;
    }

    try {
      setIsCreating(true);
      setFormError("");
      setPageError("");
      const plan = await planService.create({
        categoryId: newCategoryId,
        month: newMonth,
        amount,
      });

      if (
        plan.month === month &&
        (!categoryFilter || plan.categoryId === categoryFilter)
      ) {
        setPlans((current) =>
          sortPlans([...current, plan], categoryMap),
        );
      }
      setIsCreateOpen(false);
      setNewAmount("");
    } catch (error) {
      setFormError(getApiErrorMessage(error, "Unable to create plan."));
    } finally {
      setIsCreating(false);
    }
  };

  const startEditing = (plan: Plan) => {
    setEditingId(plan.id);
    setEditingAmount((plan.amount / 100).toFixed(2));
    setPageError("");
  };

  const handleUpdate = async (
    event: FormEvent<HTMLFormElement>,
    planId: string,
  ) => {
    event.preventDefault();
    const amount = parseAmount(editingAmount);

    if (amount === null) {
      setPageError("Enter a valid non-negative amount with up to 2 decimals");
      return;
    }

    try {
      setIsUpdating(true);
      setPageError("");
      const updatedPlan = await planService.update(planId, { amount });
      setPlans((current) =>
        current.map((plan) => (plan.id === planId ? updatedPlan : plan)),
      );
      setEditingId(null);
    } catch (error) {
      setPageError(getApiErrorMessage(error, "Unable to update plan."));
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!planToDelete) return;

    try {
      setIsDeleting(true);
      setPageError("");
      await planService.remove(planToDelete.id);
      setPlans((current) =>
        current.filter((plan) => plan.id !== planToDelete.id),
      );
      setPlanToDelete(null);
    } catch (error) {
      setPageError(getApiErrorMessage(error, "Unable to delete plan."));
      setPlanToDelete(null);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Plans"
        description="Set a monthly spending target for each category and keep your budget organized."
        action={
          <Button onClick={isCreateOpen ? () => setIsCreateOpen(false) : openCreateForm}>
            {isCreateOpen ? "Close form" : "New plan"}
          </Button>
        }
      />

      {pageError ? <ErrorBanner role="alert">{pageError}</ErrorBanner> : null}

      {isCreateOpen ? (
        <FormCard>
          <h2>Create plan</h2>
          <p>Each category can have one plan for a given month.</p>
          <PlanForm onSubmit={handleCreate} noValidate>
            <Field>
              <label htmlFor="plan-category">Category</label>
              <Select
                id="plan-category"
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
              <label htmlFor="plan-month">Month</label>
              <Control
                id="plan-month"
                type="month"
                value={newMonth}
                onChange={(event) => {
                  setNewMonth(event.target.value);
                  setFormError("");
                }}
              />
            </Field>

            <Field>
              <label htmlFor="plan-amount">Planned amount</label>
              <Control
                id="plan-amount"
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
              {formError ? (
                <FieldMessage $error role="alert">
                  {formError}
                </FieldMessage>
              ) : (
                <FieldMessage>Up to 2 decimal places</FieldMessage>
              )}
            </Field>

            <SubmitArea>
              <Button type="submit" disabled={isCreating || categories.length === 0}>
                {isCreating ? "Creating..." : "Create plan"}
              </Button>
            </SubmitArea>
          </PlanForm>
        </FormCard>
      ) : null}

      <FilterCard>
        <FilterFields>
          <Field>
            <label htmlFor="filter-month">Month</label>
            <Control
              id="filter-month"
              type="month"
              value={month}
              onChange={(event) => {
                setIsLoading(true);
                setPageError("");
                setMonth(event.target.value);
              }}
            />
          </Field>
          <Field>
            <label htmlFor="filter-category">Category</label>
            <Select
              id="filter-category"
              value={categoryFilter}
              onChange={(event) => {
                setIsLoading(true);
                setPageError("");
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
          <span>Total planned</span>
          <strong>{formatAmount(total)}</strong>
        </Summary>
      </FilterCard>

      <TableCard>
        <TableHeader>
          <h2>{formatMonth(month)}</h2>
          <span>{plans.length} {plans.length === 1 ? "plan" : "plans"}</span>
        </TableHeader>

        {isLoading ? (
          <LoadingState>Loading plans...</LoadingState>
        ) : plans.length === 0 ? (
          <EmptyState>
            <h3>No plans for this month</h3>
            <p>Create a plan to set your first spending target.</p>
          </EmptyState>
        ) : (
          <TableScroll>
            <Table>
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Month</th>
                  <th>Planned amount</th>
                  <th aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {plans.map((plan) => {
                  const category = categoryMap.get(plan.categoryId);
                  return (
                    <tr key={plan.id}>
                      <td>
                        <CategoryName>
                          <CategoryMark>
                            <AppIcon name="category" size={15} />
                          </CategoryMark>
                          {category?.name ?? "Unknown category"}
                        </CategoryName>
                      </td>
                      <td>{formatMonth(plan.month)}</td>
                      <td>
                        {editingId === plan.id ? (
                          <InlineForm
                            onSubmit={(event) =>
                              void handleUpdate(event, plan.id)
                            }
                          >
                            <Control
                              aria-label="Planned amount"
                              autoFocus
                              inputMode="decimal"
                              value={editingAmount}
                              onChange={(event) =>
                                setEditingAmount(event.target.value)
                              }
                            />
                            <Button type="submit" disabled={isUpdating}>
                              {isUpdating ? "Saving..." : "Save"}
                            </Button>
                            <Button
                              variant="secondary"
                              disabled={isUpdating}
                              onClick={() => setEditingId(null)}
                            >
                              Cancel
                            </Button>
                          </InlineForm>
                        ) : (
                          <Amount>{formatAmount(plan.amount)}</Amount>
                        )}
                      </td>
                      <td>
                        {editingId !== plan.id ? (
                          <RowActions>
                            <TextButton onClick={() => startEditing(plan)}>
                              Edit
                            </TextButton>
                            <TextButton
                              $danger
                              onClick={() => setPlanToDelete(plan)}
                            >
                              Delete
                            </TextButton>
                          </RowActions>
                        ) : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          </TableScroll>
        )}
      </TableCard>

      {planToDelete ? (
        <ConfirmDialog
          title={`Delete ${categoryMap.get(planToDelete.categoryId)?.name ?? "this"} plan?`}
          description={`The ${formatAmount(planToDelete.amount)} target for ${formatMonth(planToDelete.month)} will be permanently removed.`}
          confirmLabel="Delete plan"
          isConfirming={isDeleting}
          onCancel={() => setPlanToDelete(null)}
          onConfirm={() => void handleDelete()}
        />
      ) : null}
    </>
  );
}
