import { Route, Routes } from "react-router-dom";
import { DashboardLayout } from "../components/layout/DashboardLayout";
import { AccountPage } from "../pages/AccountPage";
import { ActualsPage } from "../pages/ActualsPage";
import { AssistantPage } from "../pages/AssistantPage";
import { CategoriesPage } from "../pages/CategoriesPage";
import { DashboardPage } from "../pages/DashboardPage";
import { LoginPage } from "../pages/LoginPage";
import { NotFoundPage } from "../pages/NotFoundPage";
import { PeriodLocksPage } from "../pages/PeriodLocksPage";
import { PlansPage } from "../pages/PlansPage";
import { ReportPage } from "../pages/ReportPage";
import { SignupPage } from "../pages/SignupPage";
import { WelcomePage } from "../pages/WelcomePage";
import { PublicOnlyRoute } from "./PublicOnlyRoute";
import { ProtectedRoute } from "./ProtectedRoute";

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<WelcomePage />} />
      <Route
        path="/login"
        element={
          <PublicOnlyRoute>
            <LoginPage />
          </PublicOnlyRoute>
        }
      />
      <Route
        path="/signup"
        element={
          <PublicOnlyRoute>
            <SignupPage />
          </PublicOnlyRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="plans" element={<PlansPage />} />
        <Route path="actuals" element={<ActualsPage />} />
        <Route path="report" element={<ReportPage />} />
        <Route path="period-locks" element={<PeriodLocksPage />} />
        <Route path="categories" element={<CategoriesPage />} />
        <Route path="assistant" element={<AssistantPage />} />
        <Route path="account" element={<AccountPage />} />
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
