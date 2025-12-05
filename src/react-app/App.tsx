import { BrowserRouter as Router, Routes, Route } from "react-router";
import { AuthProvider } from "@getmocha/users-service/react";
import HomePage from "@/react-app/pages/Home";
import AuthCallbackPage from "@/react-app/pages/AuthCallback";
import RegisterPage from "@/react-app/pages/Register";
import DashboardPage from "@/react-app/pages/Dashboard";
import PrototypePage from "@/react-app/pages/Prototype";

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/prototype" element={<PrototypePage />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
