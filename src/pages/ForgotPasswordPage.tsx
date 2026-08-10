import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { AuthForm, FormError } from "../components/auth/AuthFormElements";
import { Button } from "../components/common/Button";
import { FormField } from "../components/common/FormField";
import { AuthLayout } from "../components/layout/AuthLayout";
import { authService } from "../services/auth.service";
import { getApiErrorMessage } from "../utils/getApiErrorMessage";

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [requestError, setRequestError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setRequestError("");
    setSuccessMessage("");
    setEmailError("");

    if (!email.trim()) {
      setEmailError("Email is required");
      return;
    }

    try {
      setIsSubmitting(true);
      const message = await authService.forgotPassword({
        email: email.trim(),
      });
      setSuccessMessage(message);
    } catch (error) {
      setRequestError(
        getApiErrorMessage(
          error,
          "Unable to send reset email. Please try again.",
        ),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Forgot password"
      subtitle="Enter your account email and we’ll send a reset link."
      footer={
        <>
          Remembered it? <Link to="/login">Back to sign in</Link>
        </>
      }
    >
      <AuthForm onSubmit={(event) => void handleSubmit(event)} noValidate>
        {requestError ? <FormError role="alert">{requestError}</FormError> : null}
        {successMessage ? (
          <p
            role="status"
            style={{
              margin: 0,
              color: "var(--color-success-700, #3f6212)",
              fontSize: "var(--font-size-sm)",
            }}
          >
            {successMessage}
          </p>
        ) : null}

        <FormField
          id="email"
          label="Email address"
          type="email"
          autoComplete="email"
          placeholder="you@company.com"
          value={email}
          error={emailError}
          onChange={(event) => setEmail(event.target.value)}
        />

        <Button type="submit" fullWidth disabled={isSubmitting}>
          {isSubmitting ? "Sending..." : "Send reset link"}
        </Button>
      </AuthForm>
    </AuthLayout>
  );
}
