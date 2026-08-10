import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import styled from "styled-components";
import { AuthForm, FormError } from "../components/auth/AuthFormElements";
import { Button } from "../components/common/Button";
import { FormField } from "../components/common/FormField";
import { AuthLayout } from "../components/layout/AuthLayout";
import {
  COUNTRY_CURRENCIES,
  DEFAULT_COUNTRY_CODE,
  getCountryCurrency,
} from "../constants/currencies";
import { useAuth } from "../hooks/useAuth";
import { getApiErrorMessage } from "../utils/getApiErrorMessage";

interface SignupErrors {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  countryCode?: string;
}

const Field = styled.div`
  display: grid;
  gap: var(--space-2);
`;

const Label = styled.label`
  color: var(--color-text);
  font-size: var(--font-size-sm);
  font-weight: 650;
`;

const Select = styled.select<{ $hasError: boolean }>`
  width: 100%;
  min-height: 2.75rem;
  padding: 0.65rem 2.25rem 0.65rem 0.8rem;
  border: 1px solid
    ${({ $hasError }) =>
      $hasError ? "var(--color-danger-600)" : "var(--color-border-strong)"};
  border-radius: var(--radius-md);
  outline: none;
  background: var(--color-surface);
  color: var(--color-text);
  box-shadow: var(--shadow-sm);

  &:focus {
    border-color: ${({ $hasError }) =>
      $hasError ? "var(--color-danger-600)" : "var(--color-primary-500)"};
    box-shadow: ${({ $hasError }) =>
      $hasError ? "0 0 0 3px rgb(217 45 32 / 14%)" : "var(--focus-ring)"};
  }
`;

const Hint = styled.p`
  margin: 0;
  color: var(--color-text-subtle);
  font-size: var(--font-size-xs);
`;

const ErrorText = styled.p`
  margin: 0;
  color: var(--color-danger-600);
  font-size: var(--font-size-xs);
`;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function SignupPage() {
  const navigate = useNavigate();
  const { signup } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [countryCode, setCountryCode] = useState(DEFAULT_COUNTRY_CODE);
  const [errors, setErrors] = useState<SignupErrors>({});
  const [requestError, setRequestError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedCountry = getCountryCurrency(countryCode);

  const validate = () => {
    const nextErrors: SignupErrors = {};

    if (name.trim().length < 2) {
      nextErrors.name = "Name must contain at least 2 characters";
    }

    if (!EMAIL_PATTERN.test(email.trim())) {
      nextErrors.email = "Enter a valid email address";
    }

    if (password.length < 8) {
      nextErrors.password = "Password must contain at least 8 characters";
    }

    if (confirmPassword !== password) {
      nextErrors.confirmPassword = "Passwords do not match";
    }

    if (!COUNTRY_CURRENCIES.some((country) => country.code === countryCode)) {
      nextErrors.countryCode = "Select a supported country";
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
      await signup({
        name: name.trim(),
        email: email.trim(),
        password,
        countryCode,
      });
      navigate("/dashboard", { replace: true });
    } catch (error) {
      setRequestError(
        getApiErrorMessage(error, "Unable to create your account."),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Start tracking monthly plans and actual spending."
      footer={
        <>
          Already have an account? <Link to="/login">Sign in</Link>
        </>
      }
    >
      <AuthForm onSubmit={handleSubmit} noValidate>
        {requestError ? (
          <FormError role="alert">{requestError}</FormError>
        ) : null}

        <FormField
          id="name"
          label="Full name"
          autoComplete="name"
          placeholder="Sanjay Kumar"
          value={name}
          error={errors.name}
          onChange={(event) => setName(event.target.value)}
        />

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

        <Field>
          <Label htmlFor="country">Country / currency</Label>
          <Select
            id="country"
            value={countryCode}
            $hasError={Boolean(errors.countryCode)}
            onChange={(event) => setCountryCode(event.target.value)}
          >
            {COUNTRY_CURRENCIES.map((country) => (
              <option key={country.code} value={country.code}>
                {country.name} ({country.currency})
              </option>
            ))}
          </Select>
          <Hint>
            Amounts will display in {selectedCountry.currencyName} (
            {selectedCountry.currency})
          </Hint>
          {errors.countryCode ? (
            <ErrorText>{errors.countryCode}</ErrorText>
          ) : null}
        </Field>

        <FormField
          id="password"
          label="Password"
          type="password"
          autoComplete="new-password"
          placeholder="At least 8 characters"
          value={password}
          error={errors.password}
          onChange={(event) => setPassword(event.target.value)}
        />

        <FormField
          id="confirm-password"
          label="Confirm password"
          type="password"
          autoComplete="new-password"
          placeholder="Re-enter your password"
          value={confirmPassword}
          error={errors.confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
        />

        <Button type="submit" fullWidth disabled={isSubmitting}>
          {isSubmitting ? "Creating account..." : "Create account"}
        </Button>
      </AuthForm>
    </AuthLayout>
  );
}
