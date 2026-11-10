
import { Link } from 'react-router-dom';
import type { Court } from '../courts.types';

type CourtCardProps = {
  court: Court;
  index: number;
};

export function CourtCard({ court, index }: CourtCardProps) {
  return (
    <article className="border border-academy-line bg-[#fbfbf7] p-3">
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

      <Link
        to={`/courts/${court.id}/book`}
        className="flex justify-between border-t border-academy-line px-2 py-4 text-xs font-semibold"
      >
        View availability <span className="text-academy-green">→</span>
      </Link>
    </article>
  );
}
