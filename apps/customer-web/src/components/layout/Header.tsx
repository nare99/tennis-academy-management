
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { getCurrentUser, logout } from '../../features/auth/auth.api';
import type { PublicUser } from '../../features/auth/auth.types';
import { Brand } from './Brand';

export function Header() {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [loaded, setLoaded] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;

    getCurrentUser()
      .then((result) => {
        if (!cancelled) setUser(result.user);
      })
      .catch(() => {
        if (!cancelled) setUser(null);
      })
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleLogout() {
    try {
      await logout();
      setUser(null);
      navigate('/', { replace: true });
    } catch {
      // Keep the current session UI if logout failed.
    }
  }

  return (
    <header className="flex min-h-[76px] items-center justify-between gap-4 border-b border-academy-line px-6 sm:px-10 lg:px-[8%]">
      <Brand />

      <nav className="hidden items-center gap-8 text-sm text-stone-600 md:flex">
        <Link className="transition hover:text-academy-green" to="/#courts">
          Courts
        </Link>
        <Link className="transition hover:text-academy-green" to="/#approach">
          Our approach
        </Link>
      </nav>

      <div className="flex items-center gap-4">
        {loaded && user ? (
          <>
            <Link
              className="text-sm font-semibold text-stone-700 hover:text-academy-green"
              to="/my-bookings"
            >
              My bookings
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="text-sm font-semibold text-stone-500 hover:text-academy-green"
            >
              Log out
            </button>
          </>
        ) : (
          <>
            <Link
              className="text-sm font-semibold text-stone-700 hover:text-academy-green"
              to="/login"
            >
              Log in
            </Link>
            <Link className="button-primary !min-h-10 !px-4" to="/register">
              Get started <span aria-hidden="true">↗</span>
            </Link>
          </>
        )}
      </div>
    </header>
  );
}
