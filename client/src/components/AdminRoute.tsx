import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts';

export function AdminRoute() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-primary-900'></div>
      </div>
    );
  }

  if (!user || user.role !== 'ADMIN') {
    return <Navigate to='/login' replace />;
  }

  return <Outlet />;
}
