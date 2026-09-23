import { BrowserRouter, Routes, Route } from "react-router-dom";

import LandingPage from "./components/landing/LandingPage";
import CitizenLayout from "./layouts/CitizenLayout";
import CitizenDashboardPage from "./pages/citizen/CitizenDashboardPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Landing Page */}
        <Route path="/" element={<LandingPage />} />

        {/* Citizen Pages */}
        <Route path="/citizen" element={<CitizenLayout />}>
          <Route index element={<CitizenDashboardPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}