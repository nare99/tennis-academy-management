
import { Brand } from './Brand';

export function Footer() {
  return (
    <footer className="flex flex-col gap-4 px-6 py-7 text-xs text-academy-muted sm:flex-row sm:items-center sm:justify-between sm:px-10 lg:px-[8%]">
      <Brand />
      <span>Made for the love of the game.</span>
      <span>© {new Date().getFullYear()} Baseline Tennis Academy</span>
    </footer>
  );
}
