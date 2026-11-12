import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { useAuth } from './AuthContext';

export function ProtectedRoute() {
  const { status } = useAuth();
  const location = useLocation();

  if (status === 'loading') {
    return (
      <main className="mx-auto flex min-h-[60vh] max-w-5xl items-center px-6">
        <p className="text-sm text-academy-muted" role="status">
          Checking your account…
        </p>
      </main>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname + location.search }}
      />
    );
  }

  return <Outlet />;
}
