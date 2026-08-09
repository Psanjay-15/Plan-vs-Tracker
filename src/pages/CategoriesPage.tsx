import { useEffect, useState, type FormEvent } from "react";
import styled from "styled-components";
import { AppIcon } from "../components/common/AppIcon";
import { Button } from "../components/common/Button";
import { Card } from "../components/common/Card";
import { ConfirmDialog } from "../components/common/ConfirmDialog";
import { PageHeader } from "../components/common/PageHeader";
import { categoryService } from "../services/category.service";
import type { Category } from "../types/category";
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

const FormCard = styled(Card)`
  margin-bottom: var(--space-6);
  padding: var(--space-6);

  h2 {
    margin-bottom: var(--space-2);
    font-size: var(--font-size-lg);
  }

  p {
    margin-bottom: var(--space-5);
    color: var(--color-text-muted);
    font-size: var(--font-size-sm);
  }
`;

const CreateForm = styled.form`
  display: flex;
  align-items: flex-end;
  gap: var(--space-3);

  @media (max-width: 560px) {
    align-items: stretch;
    flex-direction: column;
  }
`;

const InputGroup = styled.div`
  display: grid;
  flex: 1;
  gap: var(--space-2);

  label {
    font-size: var(--font-size-sm);
    font-weight: 650;
  }
`;

const Input = styled.input<{ $hasError?: boolean }>`
  width: 100%;
  min-height: 2.75rem;
  padding: 0.65rem 0.8rem;
  border: 1px solid
    ${({ $hasError }) =>
      $hasError ? "var(--color-danger-600)" : "var(--color-border-strong)"};
  border-radius: var(--radius-md);
  outline: none;
  background: var(--color-surface);
  color: var(--color-text);

  &:focus {
    border-color: var(--color-primary-500);
    box-shadow: var(--focus-ring);
  }
`;

const FieldError = styled.span`
  color: var(--color-danger-600);
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
  min-width: 650px;
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

const MutedText = styled.span`
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
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

  &:hover {
    background: ${({ $danger }) =>
      $danger ? "var(--color-danger-50)" : "var(--color-primary-50)"};
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

const InlineForm = styled.form`
  display: flex;
  align-items: center;
  gap: var(--space-2);

  ${Input} {
    min-width: 220px;
  }
`;

const sortCategories = (categories: Category[]) =>
  [...categories].sort((first, second) => first.name.localeCompare(second.name));

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));

export function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [nameError, setNameError] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    let isActive = true;

    categoryService
      .getAll()
      .then((result) => {
        if (isActive) setCategories(sortCategories(result));
      })
      .catch((error) => {
        if (isActive) {
          setPageError(
            getApiErrorMessage(error, "Unable to load categories."),
          );
        }
      })
      .finally(() => {
        if (isActive) setIsLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, []);

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedName = newName.trim();

    if (!trimmedName) {
      setNameError("Category name is required");
      return;
    }

    try {
      setIsCreating(true);
      setNameError("");
      setPageError("");
      const category = await categoryService.create({ name: trimmedName });
      setCategories((current) => sortCategories([...current, category]));
      setNewName("");
      setIsCreateOpen(false);
    } catch (error) {
      setNameError(getApiErrorMessage(error, "Unable to create category."));
    } finally {
      setIsCreating(false);
    }
  };

  const startEditing = (category: Category) => {
    setEditingId(category.id);
    setEditingName(category.name);
    setPageError("");
  };

  const handleUpdate = async (
    event: FormEvent<HTMLFormElement>,
    categoryId: string,
  ) => {
    event.preventDefault();
    const trimmedName = editingName.trim();

    if (!trimmedName) {
      setPageError("Category name is required");
      return;
    }

    try {
      setIsUpdating(true);
      setPageError("");
      const updatedCategory = await categoryService.update(categoryId, {
        name: trimmedName,
      });
      setCategories((current) =>
        sortCategories(
          current.map((category) =>
            category.id === categoryId ? updatedCategory : category,
          ),
        ),
      );
      setEditingId(null);
      setEditingName("");
    } catch (error) {
      setPageError(getApiErrorMessage(error, "Unable to update category."));
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!categoryToDelete) return;

    try {
      setIsDeleting(true);
      setPageError("");
      await categoryService.remove(categoryToDelete.id);
      setCategories((current) =>
        current.filter((category) => category.id !== categoryToDelete.id),
      );
      setCategoryToDelete(null);
    } catch (error) {
      setPageError(getApiErrorMessage(error, "Unable to delete category."));
      setCategoryToDelete(null);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Categories"
        description="Organize spending targets and actual entries into categories that make sense for your business."
        action={
          <Button onClick={() => setIsCreateOpen((current) => !current)}>
            {isCreateOpen ? "Close form" : "New category"}
          </Button>
        }
      />

      {pageError ? <ErrorBanner role="alert">{pageError}</ErrorBanner> : null}

      {isCreateOpen ? (
        <FormCard>
          <h2>Create category</h2>
          <p>Add a category that can be assigned to future Plans and Actuals.</p>
          <CreateForm onSubmit={handleCreate} noValidate>
            <InputGroup>
              <label htmlFor="new-category-name">Category name</label>
              <Input
                id="new-category-name"
                autoFocus
                placeholder="For example, Office rent"
                value={newName}
                $hasError={Boolean(nameError)}
                aria-invalid={Boolean(nameError)}
                onChange={(event) => {
                  setNewName(event.target.value);
                  if (nameError) setNameError("");
                }}
              />
              {nameError ? <FieldError>{nameError}</FieldError> : null}
            </InputGroup>
            <Button type="submit" disabled={isCreating}>
              {isCreating ? "Creating..." : "Create category"}
            </Button>
          </CreateForm>
        </FormCard>
      ) : null}

      <TableCard>
        <TableHeader>
          <h2>All categories</h2>
          <span>{categories.length} total</span>
        </TableHeader>

        {isLoading ? (
          <LoadingState>Loading categories...</LoadingState>
        ) : categories.length === 0 ? (
          <EmptyState>
            <h3>No categories yet</h3>
            <p>Create your first category to begin planning.</p>
          </EmptyState>
        ) : (
          <TableScroll>
            <Table>
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Created</th>
                  <th aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {categories.map((category) => (
                  <tr key={category.id}>
                    <td>
                      {editingId === category.id ? (
                        <InlineForm
                          onSubmit={(event) =>
                            void handleUpdate(event, category.id)
                          }
                        >
                          <Input
                            aria-label="Category name"
                            autoFocus
                            value={editingName}
                            onChange={(event) =>
                              setEditingName(event.target.value)
                            }
                          />
                          <Button type="submit" disabled={isUpdating}>
                            {isUpdating ? "Saving..." : "Save"}
                          </Button>
                          <Button
                            variant="secondary"
                            onClick={() => setEditingId(null)}
                            disabled={isUpdating}
                          >
                            Cancel
                          </Button>
                        </InlineForm>
                      ) : (
                        <CategoryName>
                          <CategoryMark><AppIcon name="category" size={15} /></CategoryMark>
                          {category.name}
                        </CategoryName>
                      )}
                    </td>
                    <td>
                      <MutedText>{formatDate(category.createdAt)}</MutedText>
                    </td>
                    <td>
                      {editingId !== category.id ? (
                        <RowActions>
                          <TextButton onClick={() => startEditing(category)}>
                            Rename
                          </TextButton>
                          <TextButton
                            $danger
                            onClick={() => setCategoryToDelete(category)}
                          >
                            Delete
                          </TextButton>
                        </RowActions>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </TableScroll>
        )}
      </TableCard>

      {categoryToDelete ? (
        <ConfirmDialog
          title={`Delete ${categoryToDelete.name}?`}
          description="This action cannot be undone. Categories used by a Plan or Actual entry cannot be deleted."
          confirmLabel="Delete category"
          isConfirming={isDeleting}
          onCancel={() => setCategoryToDelete(null)}
          onConfirm={() => void handleDelete()}
        />
      ) : null}
    </>
  );
}
