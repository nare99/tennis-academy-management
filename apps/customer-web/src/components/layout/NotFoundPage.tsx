
import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <main className="flex min-h-[65vh] flex-col items-center justify-center gap-5 px-6 text-center">
      <p className="eyebrow">THAT’S OUT</p>
      <h1 className="text-4xl font-medium tracking-tight sm:text-6xl">
        Page not found.
      </h1>
      <Link to="/" className="button-primary">
        Back to home
      </Link>
    </main>
  );
}
