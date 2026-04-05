import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import LoadingSpinner from './LoadingSpinner';

export default function ProtectedRoute({ allowedRoles }) {
  const { isLoading, isAuthenticated, user } = useAuthStore();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    const destination =
      user?.role === 'admin' ? '/admin/dashboard' : '/student/dashboard';
    return <Navigate to={destination} replace />;
  }

  return <Outlet />;
}
