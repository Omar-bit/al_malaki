import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts';
import { FullPageSpinner } from './ui/Spinner';

export function GuestRoute() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <FullPageSpinner />;
  }

  if (user) {
    if (user.role === 'ADMIN' || user.role === 'VENDOR') {
      return <Navigate to='/admin/dashboard' replace />;
    }
    return <Navigate to='/dashboard' replace />;
  }

  return <Outlet />;
}
