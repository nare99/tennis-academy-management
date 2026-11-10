
import { Link } from 'react-router-dom';

export function Brand() {
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
