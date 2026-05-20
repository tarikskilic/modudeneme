import { Navigate, Route, Routes } from 'react-router-dom';
import Login from './pages/Login.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import EnergyFlow from './pages/EnergyFlow.jsx';
import FinancialSimulator from './pages/FinancialSimulator.jsx';
import ResidentDashboard from './pages/ResidentDashboard.jsx';
import CarbonPanel from './pages/CarbonPanel.jsx';
import Comparison from './pages/Comparison.jsx';
import About from './pages/About.jsx';

function getAuth() {
  try {
    const raw = localStorage.getItem('auth');
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function ProtectedRoute({ children, role }) {
  const auth = getAuth();
  if (!auth) {
    return <Navigate to="/" replace />;
  }
  if (role && auth.role !== role) {
    return <Navigate to="/" replace />;
  }
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/nedir" element={<About />} />
      <Route path="/about" element={<Navigate to="/nedir" replace />} />
      <Route
        path="/admin"
        element={
          <ProtectedRoute role="admin">
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/energy-flow"
        element={
          <ProtectedRoute role="admin">
            <EnergyFlow />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/financial"
        element={
          <ProtectedRoute role="admin">
            <FinancialSimulator />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/carbon"
        element={
          <ProtectedRoute role="admin">
            <CarbonPanel />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/comparison"
        element={
          <ProtectedRoute role="admin">
            <Comparison />
          </ProtectedRoute>
        }
      />
      <Route
        path="/resident"
        element={
          <ProtectedRoute role="resident">
            <ResidentDashboard />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
