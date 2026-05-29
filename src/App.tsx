import { Navigate, Route, Routes } from "react-router-dom";
import { AppLayout } from "./components/layout/AppLayout";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { PublicOnlyRoute } from "./components/auth/PublicOnlyRoute";
import { RequireActivePlan } from "./components/auth/RequireActivePlan";

import { Appointments } from "./pages/Appointments";
import { Availability } from "./pages/Availability";
import { Dashboard } from "./pages/Dashboard";
import { Login } from "./pages/Login";
import { NotFound } from "./pages/NotFound";
import { Plans } from "./pages/Plans";
import { PublicBooking } from "./pages/PublicBooking";
import { Register } from "./pages/Register";
import { Services } from "./pages/Services";
import { Settings } from "./pages/Settings";
import { Admin } from "./pages/Admin";
import { AdminCompanies } from "./pages/AdminCompanies";
import { AdminSubscriptions } from "./pages/AdminSubscriptions";

function ProtectedPage({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <AppLayout>{children}</AppLayout>
    </ProtectedRoute>
  );
}

function ProtectedPlanPage({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <AppLayout>
        <RequireActivePlan>{children}</RequireActivePlan>
      </AppLayout>
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
        path="/plans"
        element={
          <ProtectedPage>
            <Plans />
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

      <Route
        path="/services"
        element={
          <ProtectedPlanPage>
            <Services />
          </ProtectedPlanPage>
        }
      />

      <Route
        path="/availability"
        element={
          <ProtectedPlanPage>
            <Availability />
          </ProtectedPlanPage>
        }
      />

      <Route
        path="/appointments"
        element={
          <ProtectedPlanPage>
            <Appointments />
          </ProtectedPlanPage>
        }
      />

      <Route
        path="/admin"
        element={
          <ProtectedPage>
            <Admin />
          </ProtectedPage>
        }
      />

      <Route
        path="/admin/companies"
        element={
          <ProtectedPage>
            <AdminCompanies />
          </ProtectedPage>
        }
      />

      <Route
        path="/admin/subscriptions"
        element={
          <ProtectedPage>
            <AdminSubscriptions />
          </ProtectedPage>
        }
      />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}