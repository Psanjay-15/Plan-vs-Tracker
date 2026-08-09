import { Route, Routes } from "react-router-dom";
import { NotFoundPage } from "../pages/NotFoundPage";
import { WelcomePage } from "../pages/WelcomePage";

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<WelcomePage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
