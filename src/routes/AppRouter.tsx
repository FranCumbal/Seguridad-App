import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import MainLayout from '@/layouts/MainLayout';
import LoginPage from '@/modules/auth/pages/LoginPage';
import DashboardPage from '@/modules/dashboard/pages/DashboardPage';
import EntrevistasPage from '@/modules/entrevistas/pages/EntrevistasPage';
import NuevaEntrevistaPage from '@/modules/entrevistas/pages/NuevaEntrevistaPage';
import DetalleEntrevistaPage from '@/modules/entrevistas/pages/DetalleEntrevistaPage';
import EntrevistadoresPage from '@/modules/entrevistadores/pages/EntrevistadoresPage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <>{children}</>;
}

export default function AppRouter() {
  return (
    <Routes>
      {/* Rutas públicas */}
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />

      {/* Rutas protegidas */}
      <Route path="/" element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="entrevistas" element={<EntrevistasPage />} />
        <Route path="entrevistas/nueva" element={<NuevaEntrevistaPage />} />
        <Route path="entrevistas/:id" element={<DetalleEntrevistaPage />} />
        <Route path="entrevistadores" element={<EntrevistadoresPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
