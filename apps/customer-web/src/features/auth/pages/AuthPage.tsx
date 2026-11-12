import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import { Brand } from '../../../components/layout/Brand';
import { useAuth } from '../AuthContext';
import { login, register } from '../auth.api';

type AuthLocationState = {
  from?: string;
};

export function AuthPage({ mode }: { mode: 'login' | 'register' }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { setAuthenticatedUser } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError('');
    setSuccess('');

    try {
      const result =
        mode === 'register'
          ? await register({ name: name.trim(), email: email.trim(), password })
          : await login({ email: email.trim(), password });

      setAuthenticatedUser(result.user);
      setSuccess(`Welcome${result.user.name ? `, ${result.user.name}` : ''}!`);

      const state = location.state as AuthLocationState | null;
      const destination = state?.from ?? '/';
      window.setTimeout(() => navigate(destination, { replace: true }), 300);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="grid min-h-[calc(100vh-76px)] lg:grid-cols-[0.9fr_1.1fr]">
      <section className="flex flex-col justify-between gap-10 bg-[#e8ecdd] px-7 py-8 sm:px-12 lg:px-[10%]">
        <Brand />
        <div className="py-4">
          <p className="eyebrow">YOUR GAME, YOUR WAY</p>
          <h1 className="mt-5 text-5xl font-medium leading-none tracking-tight sm:text-6xl">
            Make space
            <br />
            for <span className="font-editorial italic text-academy-green">play.</span>
          </h1>
          <p className="mt-5 max-w-xs text-sm leading-7 text-academy-muted">
            More court time. More progress. More reasons to love tennis.
          </p>
        </div>
        <p className="text-[9px] font-bold tracking-[0.2em] text-[#66745e]">
          GOOD TENNIS STARTS HERE.
        </p>
      </section>

      <section className="flex flex-col px-6 py-7 sm:px-12 lg:px-[10%]">
        <Link to="/" className="self-start text-xs text-academy-muted hover:text-academy-green">
          ← Back to home
        </Link>

        <div className="my-auto w-full max-w-md self-center py-12">
          <p className="eyebrow">{mode === 'login' ? 'WELCOME BACK' : 'COME ON IN'}</p>
          <h2 className="mt-4 text-3xl font-medium tracking-tight sm:text-4xl">
            {mode === 'login' ? 'Good to see you.' : 'Let’s get you playing.'}
          </h2>
          <p className="mt-3 text-sm leading-6 text-academy-muted">
            {mode === 'login'
              ? 'Log in to continue your tennis journey.'
              : 'Create your account and make your next match happen.'}
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            {mode === 'register' && (
              <label className="form-label">
                Your name
                <input
                  autoComplete="name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  minLength={2}
                  maxLength={100}
                  required
                />
              </label>
            )}

            <label className="form-label">
              Email address
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                maxLength={254}
                required
              />
            </label>

            <label className="form-label">
              Password
              <input
                type="password"
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                minLength={mode === 'register' ? 12 : undefined}
                maxLength={128}
                required
              />
              {mode === 'register' && (
                <span className="font-normal text-academy-muted">
                  Use at least 12 characters.
                </span>
              )}
            </label>

            {error && <p role="alert" className="text-sm leading-6 text-red-700">{error}</p>}
            {success && <p role="status" className="text-sm text-green-800">{success}</p>}

            <button
              type="submit"
              disabled={busy}
              className="button-primary w-full disabled:cursor-wait disabled:opacity-60"
            >
              {busy ? 'Please wait…' : mode === 'login' ? 'Log in' : 'Create account'}
              {!busy && <span aria-hidden="true">↗</span>}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-academy-muted">
            {mode === 'login' ? 'New to Baseline?' : 'Already have an account?'}{' '}
            <Link
              className="font-bold text-academy-green"
              to={mode === 'login' ? '/register' : '/login'}
              state={location.state}
            >
              {mode === 'login' ? 'Create an account' : 'Log in'}
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
