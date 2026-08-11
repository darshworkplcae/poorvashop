import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Billing from './pages/Billing';
import BillHistory from './pages/BillHistory';
import Reports from './pages/Reports';
import Products from './pages/Products';
import FarmerStock from './pages/FarmerStock';
import Settings from './pages/Settings';

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/"         element={<Dashboard />} />
            <Route path="/billing"  element={<Billing />} />
            <Route path="/history"  element={<BillHistory />} />
            <Route path="/reports"  element={<Reports />} />
            <Route path="/products" element={<Products />} />
            <Route path="/stock"    element={<FarmerStock />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </AppProvider>
  );
}
