import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts';
import { FullPageSpinner } from './ui/Spinner';

export function AdminRoute() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <FullPageSpinner />;
  }

  if (!user || !['ADMIN', 'VENDOR'].includes(user.role)) {
    return <Navigate to='/login' replace />;
  }

  return <Outlet />;
}
