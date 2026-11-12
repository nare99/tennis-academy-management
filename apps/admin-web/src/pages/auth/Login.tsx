import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';

import { useAuth } from '../../features/auth/AuthContext';

const loginSchema = z.object({
  email: z.string().trim().email('Enter a valid email address.'),
  password: z.string().min(1, 'Password is required.'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function Login() {
  const { signIn, user, status } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  if (status === 'loading') {
    return (
      <main className="flex min-h-screen items-center justify-center bg-academy-paper">
        <p className="text-sm text-academy-muted">Loading...</p>
      </main>
    );
  }

  if (user?.role === 'ADMIN') {
    return <Navigate to="/dashboard" replace />;
  }

  async function onSubmit(values: LoginFormValues) {
    setServerError(null);

    try {
      const authenticatedUser = await signIn(values);

      if (authenticatedUser.role !== 'ADMIN') {
        setServerError(
          'This account does not have administrator permissions.',
        );
        return;
      }

      const state = location.state as {
        from?: { pathname?: string };
      } | null;

      navigate(state?.from?.pathname ?? '/dashboard', {
        replace: true,
      });
    } catch (error) {
      setServerError(
        error instanceof Error
          ? error.message
          : 'Unable to sign in. Please try again.',
      );
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-academy-paper p-6">
      <section className="w-full max-w-md rounded-2xl border border-academy-line bg-white p-8 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-academy-green">
          Tennis Academy
        </p>

        <h1 className="mt-6 text-3xl font-semibold text-academy-ink">
          Admin sign in
        </h1>

        <p className="mt-2 text-sm text-academy-muted">
          Sign in to manage the academy.
        </p>

        <form
          className="mt-8 space-y-5"
          onSubmit={handleSubmit(onSubmit)}
        >
          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-sm font-medium text-academy-ink"
            >
              Email
            </label>

            <input
              id="email"
              type="email"
              autoComplete="username"
              {...register('email')}
              aria-invalid={Boolean(errors.email)}
              className="w-full rounded-lg border border-academy-line px-3 py-2.5 text-sm outline-none focus:border-academy-green focus:ring-2 focus:ring-academy-green/10"
            />

            {errors.email && (
              <p className="mt-1 text-sm text-red-600">
                {errors.email.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-2 block text-sm font-medium text-academy-ink"
            >
              Password
            </label>

            <input
              id="password"
              type="password"
              autoComplete="current-password"
              {...register('password')}
              aria-invalid={Boolean(errors.password)}
              className="w-full rounded-lg border border-academy-line px-3 py-2.5 text-sm outline-none focus:border-academy-green focus:ring-2 focus:ring-academy-green/10"
            />

            {errors.password && (
              <p className="mt-1 text-sm text-red-600">
                {errors.password.message}
              </p>
            )}
          </div>

          {serverError && (
            <p
              role="alert"
              className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700"
            >
              {serverError}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-lg bg-academy-green px-4 py-3 text-sm font-semibold text-white transition hover:bg-academy-ink disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </section>
    </main>
  );
}
