import { useState, type FormEvent } from "react";
import styled from "styled-components";
import { Button } from "../components/common/Button";
import { Card } from "../components/common/Card";
import { FormField } from "../components/common/FormField";
import { PageHeader } from "../components/common/PageHeader";
import { useToast } from "../hooks/useToast";
import { authService } from "../services/auth.service";
import { getApiErrorMessage } from "../utils/getApiErrorMessage";

const FormCard = styled(Card)`
  max-width: 480px;
  padding: var(--space-6);

  h2 {
    margin: 0 0 var(--space-2);
    font-size: var(--font-size-lg);
  }

  p {
    margin: 0 0 var(--space-5);
    color: var(--color-text-muted);
    font-size: var(--font-size-sm);
  }
`;

const Form = styled.form`
  display: grid;
  gap: var(--space-4);
`;

const ErrorText = styled.p`
  margin: 0;
  color: var(--color-danger-600);
  font-size: var(--font-size-sm);
`;

interface FormErrors {
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
}

export function AccountPage() {
  const toast = useToast();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [requestError, setRequestError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = () => {
    const nextErrors: FormErrors = {};
    if (!currentPassword) {
      nextErrors.currentPassword = "Current password is required";
    }
    if (newPassword.length < 8) {
      nextErrors.newPassword = "Password must contain at least 8 characters";
    }
    if (confirmPassword !== newPassword) {
      nextErrors.confirmPassword = "Passwords do not match";
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setRequestError("");
    if (!validate()) return;

    try {
      setIsSubmitting(true);
      const message = await authService.changePassword({
        currentPassword,
        newPassword,
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast.success(message);
    } catch (error) {
      setRequestError(
        getApiErrorMessage(error, "Unable to update password."),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Account"
        description="Update your password and keep your workspace secure."
      />
      <FormCard>
        <h2>Change password</h2>
        <p>Use your current password, then choose a new one with at least 8 characters.</p>
        <Form onSubmit={(event) => void handleSubmit(event)} noValidate>
          {requestError ? <ErrorText role="alert">{requestError}</ErrorText> : null}
          <FormField
            id="current-password"
            label="Current password"
            type="password"
            autoComplete="current-password"
            value={currentPassword}
            error={errors.currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
          />
          <FormField
            id="new-password"
            label="New password"
            type="password"
            autoComplete="new-password"
            value={newPassword}
            error={errors.newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
          />
          <FormField
            id="confirm-password"
            label="Confirm new password"
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            error={errors.confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
          />
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Updating..." : "Update password"}
          </Button>
        </Form>
      </FormCard>
    </>
  );
}
