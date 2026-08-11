import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AppProvider }  from './context/AppContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout      from './components/Layout';
import Login       from './pages/Login';
import Dashboard   from './pages/Dashboard';
import Billing     from './pages/Billing';
import BillHistory from './pages/BillHistory';
import Reports     from './pages/Reports';
import Products    from './pages/Products';
import FarmerStock from './pages/FarmerStock';
import Settings    from './pages/Settings';
import Admin       from './pages/Admin';

// Wraps Layout + auth check — renders Outlet (child routes) inside
function ProtectedLayout() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return <Layout />;
}

// Admin-only guard
function AdminGuard() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'admin') return <Navigate to="/" replace />;
  return <Outlet />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <BrowserRouter>
          <Routes>
            {/* Public route */}
            <Route path="/login" element={<LoginRedirect />} />

            {/* Protected layout — all pages inside Layout */}
            <Route element={<ProtectedLayout />}>
              <Route path="/"         element={<Dashboard />} />
              <Route path="/billing"  element={<Billing />} />
              <Route path="/history"  element={<BillHistory />} />
              <Route path="/reports"  element={<Reports />} />
              <Route path="/products" element={<Products />} />
              <Route path="/stock"    element={<FarmerStock />} />
              <Route path="/settings" element={<Settings />} />

              {/* Admin-only */}
              <Route element={<AdminGuard />}>
                <Route path="/admin" element={<Admin />} />
              </Route>
            </Route>

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AppProvider>
    </AuthProvider>
  );
}

// Redirect to / if already logged in
function LoginRedirect() {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <Navigate to="/" replace /> : <Login />;
}
