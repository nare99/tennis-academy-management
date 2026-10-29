
import { useEffect, useState, type FormEvent } from 'react';
import { Link, Route, Routes, useNavigate } from 'react-router-dom';

type Court = {
  id: string;
  name: string;
  surface: string | null;
  isIndoor: boolean;
};

type PublicUser = {
  id: string;
  name: string;
  email: string;
  role: 'CUSTOMER' | 'TRAINER' | 'ADMIN';
  isActive: boolean;
};

async function apiRequest<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(path, {
    ...init,
    credentials: 'include',
    headers: {
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...init?.headers,
    },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    const message = body?.message;

    throw new Error(
      Array.isArray(message)
        ? message.join(' ')
        : typeof message === 'string'
          ? message
          : `Request failed (${response.status})`,
    );
  }

  return response.json() as Promise<T>;
}

function Brand() {
  return (
    <Link to="/" className="flex items-center gap-2.5 font-bold tracking-tight">
      <span className="grid size-9 place-items-center rounded-full bg-academy-green text-lg font-medium text-white">
        B
      </span>
      <span className="text-xl">
        baseline<span className="text-academy-green">.</span>
      </span>
    </Link>
  );
}

function Header() {
  return (
    <header className="flex min-h-[76px] items-center justify-between gap-4 border-b border-academy-line px-6 sm:px-10 lg:px-[8%]">
      <Brand />
      <nav className="hidden items-center gap-8 text-sm text-stone-600 md:flex">
        <a className="transition hover:text-academy-green" href="#courts">Courts</a>
        <a className="transition hover:text-academy-green" href="#approach">Our approach</a>
      </nav>
      <div className="flex items-center gap-4">
        <Link className="text-sm font-semibold text-stone-700 hover:text-academy-green" to="/login">
          Log in
        </Link>
        <Link className="button-primary !min-h-10 !px-4" to="/register">
          Get started <span aria-hidden="true">↗</span>
        </Link>
      </div>
    </header>
  );
}

function HomePage() {
  const [courts, setCourts] = useState<Court[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    apiRequest<Court[]>('/api/courts')
      .then((data) => {
        if (!cancelled) setCourts(data);
      })
      .catch(() => {
        if (!cancelled) {
          setError('We couldn’t load the courts. Please try again shortly.');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      <main>
        <section className="relative grid gap-12 px-6 py-14 sm:px-10 lg:grid-cols-[1fr_0.9fr] lg:items-center lg:gap-16 lg:px-[11%] lg:py-20">
          <div className="relative z-10">
            <p className="eyebrow">
              <span className="size-2 rounded-full bg-lime-600" />
              YOUR NEXT MATCH STARTS HERE
            </p>
            <h1 className="mt-7 text-6xl font-medium leading-[0.98] tracking-[-0.065em] sm:text-7xl lg:text-[88px]">
              Make time
              <br />
              for <span className="font-editorial italic text-academy-green">your game.</span>
            </h1>
            <p className="mt-6 max-w-md text-sm leading-7 text-academy-muted sm:text-base">
              Find your court. Meet your coach. Play a little more.
              Your tennis routine starts with one booking.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="#courts" className="button-primary">
                Find your court <span aria-hidden="true">↗</span>
              </a>
              <a href="#approach" className="button-secondary">
                Discover Baseline
              </a>
            </div>
            <p className="mt-10 flex items-center gap-3 text-xs text-stone-500">
              <span className="text-xl text-academy-green">✳</span>
              Good tennis. Good people. More often.
            </p>
          </div>

          <div
            className="relative flex min-h-[340px] items-center justify-center overflow-hidden bg-[#e7ebd9] sm:min-h-[430px]"
            role="img"
            aria-label="Illustrated green tennis court"
          >
            <span className="absolute left-5 top-5 text-[9px] font-bold tracking-[0.2em] text-[#66775e]">
              PLAY YOUR WAY
            </span>
            <div className="aspect-[0.8] w-[53%] rotate-[-7deg] bg-[#6e9469] p-3 shadow-2xl shadow-green-950/15">
              <div className="relative h-full border-2 border-[#f7f7e8]">
                <div className="absolute inset-x-0 bottom-1/4 top-1/4 border-y-2 border-[#f7f7e8]" />
                <div className="absolute bottom-1/4 left-1/2 top-1/4 border-l-2 border-[#f7f7e8]" />
                <div className="absolute inset-x-[-2px] top-1/2 border-t-[4px] border-[#263d2e]" />
              </div>
            </div>
            <div className="absolute bottom-[16%] right-[7%] flex size-[88px] rotate-6 flex-col items-center justify-center rounded-full bg-academy-lime text-academy-ink">
              <span className="text-[11px] tracking-[0.2em]">LOVE</span>
              <strong className="text-2xl tracking-tight">ALL.</strong>
            </div>
            <div className="absolute inset-x-5 bottom-4 flex justify-between text-[8px] font-bold tracking-widest text-[#64745d]">
              <span>01 / THE COURT</span>
              <span>YOUR TIME, YOUR GAME</span>
            </div>
          </div>
        </section>

        <section id="approach" className="grid gap-8 border-y border-academy-line bg-[#f1f2e9] px-6 py-10 sm:grid-cols-3 sm:px-10 lg:gap-12 lg:px-[11%]">
          {[
            ['01', 'Find your rhythm', 'Choose a court that fits your day and your style of play.'],
            ['02', 'Keep getting better', 'Build your skills with coaching and structured practice.'],
            ['03', 'Play together', 'Make room for friendly matches and group sessions.'],
          ].map(([number, title, description]) => (
            <article key={number}>
              <span className="text-xs tracking-widest text-[#789065]">{number}</span>
              <h2 className="mt-3 text-base font-semibold tracking-tight">{title}</h2>
              <p className="mt-2 max-w-xs text-xs leading-6 text-academy-muted">{description}</p>
            </article>
          ))}
        </section>

        <section id="courts" className="px-6 py-16 sm:px-10 lg:px-[11%] lg:py-24">
          <div className="mb-9 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <p className="eyebrow">YOUR PLACE TO PLAY</p>
              <h2 className="mt-3 text-4xl font-medium tracking-tight sm:text-5xl">
                Meet the <span className="font-editorial italic text-academy-green">courts.</span>
              </h2>
            </div>
            <p className="text-xs text-academy-muted">Every great rally starts somewhere.</p>
          </div>

          {loading && <p className="py-8 text-sm text-academy-muted">Finding your courts…</p>}
          {error && <p role="alert" className="py-8 text-sm text-red-700">{error}</p>}
          {!loading && !error && courts.length === 0 && (
            <p className="py-8 text-sm text-academy-muted">No active courts are available right now.</p>
          )}

          {!loading && !error && courts.length > 0 && (
            <div className="grid gap-5 sm:grid-cols-2">
              {courts.map((court, index) => (
                <article key={court.id} className="border border-academy-line bg-[#fbfbf7] p-3">
                  <div className={`court-art court-art-${index % 3}`}>
                    <span className="absolute left-4 top-4 text-[9px] font-bold tracking-widest text-[#53644e]">
                      COURT {String(index + 1).padStart(2, '0')}
                    </span>
                    <div className="mini-court">
                      <div />
                    </div>
                    <span className="absolute bottom-4 right-4 grid size-8 place-items-center rounded-full bg-academy-paper text-lg">
                      ↗
                    </span>
                  </div>
                  <div className="flex items-start justify-between gap-3 px-2 pb-4 pt-5">
                    <div>
                      <h3 className="font-semibold tracking-tight">{court.name}</h3>
                      <p className="mt-2 text-xs text-academy-muted">
                        {court.surface?.trim() || 'Surface details coming soon'}
                        <span className="mx-2">·</span>
                        {court.isIndoor ? 'Indoor' : 'Outdoor'}
                      </p>
                    </div>
                    <span className="rounded-sm bg-[#e8efdd] px-2 py-1.5 text-[9px] font-bold text-[#43603b]">
                      Active
                    </span>
                  </div>
                  <Link to="/register" className="flex justify-between border-t border-academy-line px-2 py-4 text-xs font-semibold">
                    Sign in to get started <span className="text-academy-green">→</span>
                  </Link>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="flex flex-col items-start justify-between gap-6 bg-[#e8ecdd] px-6 py-12 sm:flex-row sm:items-center sm:px-10 lg:px-[11%]">
          <div>
            <p className="eyebrow">THE COURT IS CALLING</p>
            <h2 className="mt-3 max-w-lg text-3xl font-medium tracking-tight sm:text-4xl">
              A little more tennis goes a long way.
            </h2>
          </div>
          <Link to="/register" className="button-primary shrink-0">
            Join the academy <span aria-hidden="true">↗</span>
          </Link>
        </section>
      </main>

      <footer className="flex flex-col gap-4 px-6 py-7 text-xs text-academy-muted sm:flex-row sm:items-center sm:justify-between sm:px-10 lg:px-[8%]">
        <Brand />
        <span>Made for the love of the game.</span>
        <span>© {new Date().getFullYear()} Baseline Tennis Academy</span>
      </footer>
    </>
  );
}

function AuthPage({ mode }: { mode: 'login' | 'register' }) {
  const navigate = useNavigate();
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
      const payload =
        mode === 'register' ? { name: name.trim(), email: email.trim(), password } : { email: email.trim(), password };

      const user = await apiRequest<PublicUser>(`/api/auth/${mode}`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      setSuccess(`Welcome${user.name ? `, ${user.name}` : ''}!`);
      window.setTimeout(() => navigate('/'), 700);
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
        <p className="text-[9px] font-bold tracking-[0.2em] text-[#66745e]">GOOD TENNIS STARTS HERE.</p>
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
                <span className="font-normal text-academy-muted">Use at least 12 characters.</span>
              )}
            </label>

            {error && <p role="alert" className="text-sm leading-6 text-red-700">{error}</p>}
            {success && <p role="status" className="text-sm text-green-800">{success}</p>}

            <button type="submit" disabled={busy} className="button-primary w-full disabled:cursor-wait disabled:opacity-60">
              {busy ? 'Please wait…' : mode === 'login' ? 'Log in' : 'Create account'}
              {!busy && <span aria-hidden="true">↗</span>}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-academy-muted">
            {mode === 'login' ? 'New to Baseline?' : 'Already have an account?'}{' '}
            <Link className="font-bold text-academy-green" to={mode === 'login' ? '/register' : '/login'}>
              {mode === 'login' ? 'Create an account' : 'Log in'}
            </Link>
          </p>
          <p className="mt-8 text-center text-[10px] leading-5 text-stone-400">
            By continuing, you agree to use the academy platform responsibly.
          </p>
        </div>
      </section>
    </main>
  );
}

function NotFoundPage() {
  return (
    <main className="flex min-h-[65vh] flex-col items-center justify-center gap-5 px-6 text-center">
      <p className="eyebrow">THAT’S OUT</p>
      <h1 className="text-4xl font-medium tracking-tight sm:text-6xl">Page not found.</h1>
      <Link to="/" className="button-primary">Back to home</Link>
    </main>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<><Header /><HomePage /></>} />
      <Route path="/login" element={<AuthPage mode="login" />} />
      <Route path="/register" element={<AuthPage mode="register" />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
