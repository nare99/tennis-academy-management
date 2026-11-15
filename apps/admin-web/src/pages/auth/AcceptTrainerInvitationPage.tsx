import { useState, type FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { apiRequest, ApiError } from '../../lib/api-client';

export default function AcceptTrainerInvitationPage() {
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (!token) { setError('This invitation link is missing its token.'); return; }
    if (password.length < 12 || password.length > 128) { setError('Password must be between 12 and 128 characters.'); return; }
    if (password !== confirmPassword) { setError('Passwords do not match.'); return; }

    setSubmitting(true);
    try {
      await apiRequest('/api/trainers/invitations/accept', {
        method: 'POST',
        body: JSON.stringify({ token, password }),
      });
      setSuccess(true);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Unable to accept this invitation.');
    } finally {
      setSubmitting(false);
    }
  }

  return <main className="flex min-h-screen items-center justify-center bg-academy-paper px-4 py-10">
    <div className="w-full max-w-md rounded-2xl border border-academy-line bg-white p-8 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-academy-green">Tennis Academy</p>
      {success ? <>
        <h1 className="mt-4 text-2xl font-semibold text-academy-ink">Account activated</h1>
        <p className="mt-2 text-sm text-academy-muted">Your password has been set. You can now sign in using your trainer account.</p>
        <a href="/login" className="mt-6 inline-flex rounded-lg bg-academy-green px-4 py-2.5 text-sm font-semibold text-white">Go to sign in</a>
      </> : <>
        <h1 className="mt-4 text-2xl font-semibold text-academy-ink">Set your password</h1>
        <p className="mt-2 text-sm text-academy-muted">Choose a password to activate your trainer account.</p>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <div><label htmlFor="invite-password" className="text-sm font-medium">Password</label>
            <input id="invite-password" type="password" autoComplete="new-password" required minLength={12} maxLength={128} value={password} onChange={(event) => setPassword(event.target.value)} className="mt-1 w-full rounded-lg border border-academy-line px-3 py-2.5 text-sm" />
          </div>
          <div><label htmlFor="invite-confirm" className="text-sm font-medium">Confirm password</label>
            <input id="invite-confirm" type="password" autoComplete="new-password" required minLength={12} maxLength={128} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className="mt-1 w-full rounded-lg border border-academy-line px-3 py-2.5 text-sm" />
          </div>
          {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
          <button type="submit" disabled={submitting || !token} className="w-full rounded-lg bg-academy-green px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60">{submitting ? 'Activating…' : 'Activate account'}</button>
        </form>
      </>}
    </div>
  </main>;
}
