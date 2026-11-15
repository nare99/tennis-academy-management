import type { Court } from '../courts.types';

type CourtsTableProps = {
  courts: Court[];
  updatingCourtId?: string;
  onEdit: (court: Court) => void;
  onToggleStatus: (court: Court) => void;
};

export default function CourtsTable({
  courts,
  updatingCourtId,
  onEdit,
  onToggleStatus,
}: CourtsTableProps) {
  if (courts.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-academy-line bg-white px-6 py-12 text-center">
        <p className="font-medium text-academy-ink">No courts yet</p>
        <p className="mt-1 text-sm text-academy-muted">
          Add your first court to start managing the academy facilities.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-academy-line bg-white">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[650px] border-collapse text-left text-sm">
          <thead className="bg-academy-paper text-xs uppercase tracking-wide text-academy-muted">
            <tr>
              <th scope="col" className="px-5 py-3 font-semibold">Court</th>
              <th scope="col" className="px-5 py-3 font-semibold">Surface</th>
              <th scope="col" className="px-5 py-3 font-semibold">Location</th>
              <th scope="col" className="px-5 py-3 font-semibold">Lights</th>
              <th scope="col" className="px-5 py-3 font-semibold">Status</th>
              <th scope="col" className="px-5 py-3 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-academy-line">
            {courts.map((court) => (
              <tr key={court.id} className="hover:bg-academy-paper/60">
                <td className="px-5 py-4 font-medium text-academy-ink">{court.name}</td>
                <td className="px-5 py-4 text-academy-muted">{court.surface || '—'}</td>
                <td className="px-5 py-4 text-academy-muted">{court.isIndoor ? 'Indoor' : 'Outdoor'}</td>
                <td className="px-5 py-4 text-academy-muted">{court.hasLights ? 'Yes' : 'No'}</td>
                <td className="px-5 py-4">
                  <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${court.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                    {court.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => onEdit(court)}
                      className="font-medium text-academy-green hover:text-academy-ink"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => onToggleStatus(court)}
                      disabled={updatingCourtId === court.id}
                      className="font-medium text-academy-muted hover:text-academy-ink disabled:opacity-50"
                    >
                      {updatingCourtId === court.id
                        ? 'Updating…'
                        : court.isActive
                          ? 'Deactivate'
                          : 'Activate'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
