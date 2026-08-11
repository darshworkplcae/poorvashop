import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
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

// Redirects to /login if not authenticated
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

// Admin-only route guard
function AdminRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'admin') return <Navigate to="/" replace />;
  return children;
}

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />

      {/* Protected */}
      <Route path="/" element={
        <ProtectedRoute>
          <Layout>
            <Routes>
              <Route path="/"         element={<Dashboard />} />
              <Route path="/billing"  element={<Billing />} />
              <Route path="/history"  element={<BillHistory />} />
              <Route path="/reports"  element={<Reports />} />
              <Route path="/products" element={<Products />} />
              <Route path="/stock"    element={<FarmerStock />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/admin"    element={
                <AdminRoute><Admin /></AdminRoute>
              } />
            </Routes>
          </Layout>
        </ProtectedRoute>
      } />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AppProvider>
    </AuthProvider>
  );
}
