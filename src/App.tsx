import { Navigate, Route, Routes } from "react-router-dom";
import { AppLayout } from "./components/layout/AppLayout";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { PublicOnlyRoute } from "./components/auth/PublicOnlyRoute";

import { Appointments } from "./pages/Appointments";
import { Availability } from "./pages/Availability";
import { Dashboard } from "./pages/Dashboard";
import { Login } from "./pages/Login";
import { NotFound } from "./pages/NotFound";
import { PublicBooking } from "./pages/PublicBooking";
import { Register } from "./pages/Register";
import { Services } from "./pages/Services";
import { Settings } from "./pages/Settings";

function ProtectedPage({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <AppLayout>{children}</AppLayout>
    </ProtectedRoute>
  );
}

export function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      <Route
        path="/login"
        element={
          <PublicOnlyRoute>
            <Login />
          </PublicOnlyRoute>
        }
      />

      <Route
        path="/register"
        element={
          <PublicOnlyRoute>
            <Register />
          </PublicOnlyRoute>
        }
      />

      <Route path="/booking/:slug" element={<PublicBooking />} />

      <Route
        path="/dashboard"
        element={
          <ProtectedPage>
            <Dashboard />
          </ProtectedPage>
        }
      />

      <Route
        path="/services"
        element={
          <ProtectedPage>
            <Services />
          </ProtectedPage>
        }
      />

      <Route
        path="/availability"
        element={
          <ProtectedPage>
            <Availability />
          </ProtectedPage>
        }
      />

      <Route
        path="/appointments"
        element={
          <ProtectedPage>
            <Appointments />
          </ProtectedPage>
        }
      />

      <Route
        path="/settings"
        element={
          <ProtectedPage>
            <Settings />
          </ProtectedPage>
        }
      />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}