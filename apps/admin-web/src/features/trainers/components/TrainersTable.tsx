import type { Trainer } from '../trainers.types';

type Props = {
  trainers: Trainer[];
  busyId?: string;
  onEdit: (trainer: Trainer) => void;
  onToggleStatus: (trainer: Trainer) => void;
  onReissue: (trainer: Trainer) => void;
};

export default function TrainersTable({ trainers, busyId, onEdit, onToggleStatus, onReissue }: Props) {
  if (!trainers.length) {
    return <div className="rounded-xl border border-dashed border-academy-line bg-white px-6 py-12 text-center">
      <p className="font-medium">No trainers yet</p>
      <p className="mt-1 text-sm text-academy-muted">Add a trainer to start building your coaching team.</p>
    </div>;
  }

  return <div className="overflow-hidden rounded-xl border border-academy-line bg-white">
    <div className="overflow-x-auto">
      <table className="w-full min-w-[760px] text-left text-sm">
        <thead className="bg-academy-paper text-xs uppercase tracking-wide text-academy-muted">
          <tr>
            <th className="px-5 py-3">Trainer</th><th className="px-5 py-3">Hourly rate</th>
            <th className="px-5 py-3">Status</th><th className="px-5 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-academy-line">
          {trainers.map((trainer) => <tr key={trainer.id}>
            <td className="px-5 py-4">
              <p className="font-medium text-academy-ink">{trainer.name}</p>
              <p className="mt-1 text-xs text-academy-muted">{trainer.email}</p>
            </td>
            <td className="px-5 py-4 text-academy-muted">
              {trainer.trainerProfile?.hourlyRateMinor == null
                ? '—'
                : new Intl.NumberFormat(undefined, { style: 'currency', currency: trainer.trainerProfile.currency }).format(trainer.trainerProfile.hourlyRateMinor / 100)}
            </td>
            <td className="px-5 py-4">
              <span className="rounded-full bg-academy-paper px-2.5 py-1 text-xs font-semibold">{trainer.status}</span>
              {trainer.invitationExpiresAt && <p className="mt-1 text-xs text-academy-muted">Invite expires {new Date(trainer.invitationExpiresAt).toLocaleDateString()}</p>}
            </td>
            <td className="px-5 py-4">
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => onEdit(trainer)} className="font-medium text-academy-green">Edit</button>
                {trainer.status === 'INVITED' && <button type="button" disabled={busyId === trainer.id} onClick={() => onReissue(trainer)} className="font-medium text-academy-muted disabled:opacity-50">Reissue invite</button>}
                {trainer.status !== 'INVITED' && <button type="button" disabled={busyId === trainer.id} onClick={() => onToggleStatus(trainer)} className="font-medium text-academy-muted disabled:opacity-50">{trainer.isActive ? 'Deactivate' : 'Activate'}</button>}
              </div>
            </td>
          </tr>)}
        </tbody>
      </table>
    </div>
  </div>;
}
