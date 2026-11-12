import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { useAuth } from '../../features/auth/AuthContext';

export default function RequireAdmin() {
  const { user, status } = useAuth();
  const location = useLocation();

  if (status === 'loading') {
    return (
      <main className="flex min-h-screen items-center justify-center bg-academy-paper">
        <p className="text-sm text-academy-muted">
          Checking your session...
        </p>
      </main>
    );
  }

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location }}
      />
    );
  }

  if (user.role !== 'ADMIN') {
    return (
      <main className="flex min-h-screen items-center justify-center bg-academy-paper p-6">
        <section className="max-w-md rounded-xl border border-academy-line bg-white p-8 text-center">
          <h1 className="text-xl font-semibold text-academy-ink">
            Access denied
          </h1>

          <p className="mt-2 text-sm text-academy-muted">
            Your account does not have administrator permissions.
          </p>
        </section>
      </main>
    );
  }

  return <Outlet />;
}
