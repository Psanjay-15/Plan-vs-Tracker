import { useMemo, useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { AuthForm, FormError } from "../components/auth/AuthFormElements";
import { Button } from "../components/common/Button";
import { FormField } from "../components/common/FormField";
import { AuthLayout } from "../components/layout/AuthLayout";
import { useAuth } from "../hooks/useAuth";
import { authService } from "../services/auth.service";
import { getApiErrorMessage } from "../utils/getApiErrorMessage";

interface ResetErrors {
  password?: string;
  confirmPassword?: string;
}

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { refreshUser } = useAuth();
  const token = useMemo(
    () => searchParams.get("token")?.trim() ?? "",
    [searchParams],
  );

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<ResetErrors>({});
  const [requestError, setRequestError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = () => {
    const nextErrors: ResetErrors = {};
    if (password.length < 8) {
      nextErrors.password = "Password must contain at least 8 characters";
    }
    if (confirmPassword !== password) {
      nextErrors.confirmPassword = "Passwords do not match";
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setRequestError("");

    if (!token) {
      setRequestError("This reset link is missing a token.");
      return;
    }

    if (!validate()) return;

    try {
      setIsSubmitting(true);
      await authService.resetPassword({ token, newPassword: password });
      await refreshUser();
      navigate("/dashboard", { replace: true });
    } catch (error) {
      setRequestError(
        getApiErrorMessage(
          error,
          "Unable to reset password. Request a new link.",
        ),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Choose a new password"
      subtitle="Pick a new password for your Plan vs Actual account."
      footer={
        <>
          Back to <Link to="/login">sign in</Link>
        </>
      }
    >
      <AuthForm onSubmit={(event) => void handleSubmit(event)} noValidate>
        {requestError ? <FormError role="alert">{requestError}</FormError> : null}

        {!token ? (
          <FormError role="alert">
            This reset link is invalid. Request a new one from{" "}
            <Link to="/forgot-password">forgot password</Link>.
          </FormError>
        ) : null}

        <FormField
          id="password"
          label="New password"
          type="password"
          autoComplete="new-password"
          placeholder="At least 8 characters"
          value={password}
          error={errors.password}
          onChange={(event) => setPassword(event.target.value)}
        />

        <FormField
          id="confirm-password"
          label="Confirm new password"
          type="password"
          autoComplete="new-password"
          placeholder="Re-enter your password"
          value={confirmPassword}
          error={errors.confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
        />

        <Button type="submit" fullWidth disabled={isSubmitting || !token}>
          {isSubmitting ? "Updating..." : "Reset password"}
        </Button>
      </AuthForm>
    </AuthLayout>
  );
}
