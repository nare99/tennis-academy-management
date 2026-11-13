import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';

import { useAuth } from '../features/auth/AuthContext';

const navigation = [
  { label: 'Dashboard', path: '/dashboard' },
  { label: 'Courts', path: '/courts' },
  { label: 'Operating hours', path: '/operating-hours' },
];

export default function AdminLayout() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [logoutError, setLogoutError] = useState<string | null>(null);

  async function handleLogout() {
    setLogoutError(null);

    try {
      await signOut();
      navigate('/login', { replace: true });
    } catch {
      setLogoutError('Unable to log out. Please try again.');
    }
  }

  return (
    <div className="min-h-screen bg-academy-paper md:flex">
      <aside className="flex w-full flex-col border-b border-academy-line bg-white md:min-h-screen md:w-64 md:border-b-0 md:border-r">
        <div className="border-b border-academy-line px-6 py-6">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-academy-green">
            Tennis Academy
          </p>
          <p className="mt-1 text-sm text-academy-muted">
            Administration
          </p>
        </div>

        <nav className="flex gap-2 overflow-x-auto p-4 md:flex-1 md:flex-col">
          {navigation.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `rounded-lg px-4 py-3 text-sm font-medium transition ${
                  isActive
                    ? 'bg-academy-green text-white'
                    : 'text-academy-muted hover:bg-academy-paper hover:text-academy-ink'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden border-t border-academy-line p-4 md:block">
          <p className="truncate text-sm font-medium text-academy-ink">
            {user?.name}
          </p>
          <p className="truncate text-xs text-academy-muted">
            {user?.email}
          </p>

          <button
            type="button"
            onClick={handleLogout}
            className="mt-4 w-full rounded-lg border border-academy-line px-4 py-2 text-sm font-medium text-academy-ink hover:bg-academy-paper"
          >
            Sign out
          </button>

          {logoutError && (
            <p role="alert" className="mt-2 text-xs text-red-600">
              {logoutError}
            </p>
          )}
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="flex items-center justify-between border-b border-academy-line bg-white px-6 py-4">
          <h1 className="text-lg font-semibold text-academy-ink">
            Academy management
          </h1>

          <button
            type="button"
            onClick={handleLogout}
            className="text-sm font-medium text-academy-green hover:text-academy-ink md:hidden"
          >
            Sign out
          </button>
        </header>

        <main className="p-6 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
