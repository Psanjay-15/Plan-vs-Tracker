import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthForm, FormError } from "../components/auth/AuthFormElements";
import { Button } from "../components/common/Button";
import { FormField } from "../components/common/FormField";
import { AuthLayout } from "../components/layout/AuthLayout";
import { useAuth } from "../hooks/useAuth";
import { getApiErrorMessage } from "../utils/getApiErrorMessage";

interface LoginErrors {
  email?: string;
  password?: string;
}

export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<LoginErrors>({});
  const [requestError, setRequestError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = () => {
    const nextErrors: LoginErrors = {};

    if (!email.trim()) nextErrors.email = "Email is required";
    if (!password) nextErrors.password = "Password is required";

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setRequestError("");

    if (!validate()) return;

    try {
      setIsSubmitting(true);
      await login({ email: email.trim(), password });
      navigate("/dashboard", { replace: true });
    } catch (error) {
      setRequestError(
        getApiErrorMessage(error, "Unable to sign in. Please try again."),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to continue to your financial workspace."
      footer={
        <>
          New to Plan vs Actual? <Link to="/signup">Create an account</Link>
        </>
      }
    >
      <AuthForm onSubmit={handleSubmit} noValidate>
        {requestError ? (
          <FormError role="alert">{requestError}</FormError>
        ) : null}

        <FormField
          id="email"
          label="Email address"
          type="email"
          autoComplete="email"
          placeholder="you@company.com"
          value={email}
          error={errors.email}
          onChange={(event) => setEmail(event.target.value)}
        />

        <FormField
          id="password"
          label="Password"
          type="password"
          autoComplete="current-password"
          placeholder="Enter your password"
          value={password}
          error={errors.password}
          onChange={(event) => setPassword(event.target.value)}
        />

        <div style={{ marginTop: "-0.35rem", textAlign: "right" }}>
          <Link to="/forgot-password">Forgot password?</Link>
        </div>

        <Button type="submit" fullWidth disabled={isSubmitting}>
          {isSubmitting ? "Signing in..." : "Sign in"}
        </Button>
      </AuthForm>
    </AuthLayout>
  );
}
