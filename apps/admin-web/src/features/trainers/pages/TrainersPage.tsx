import { useState } from 'react';
import { ApiError } from '../../../lib/api-client';
import TrainerForm from '../components/TrainerForm';
import TrainersTable from '../components/TrainersTable';
import type { TrainerFormValues } from '../trainers.schemas';
import type { Trainer, TrainerInput } from '../trainers.types';
import {
  useCreateTrainer, useReissueTrainerInvitation, useTrainers, useUpdateTrainer, useUpdateTrainerStatus,
} from '../trainers.queries';

function errorMessage(error: unknown) {
  if (error instanceof ApiError || error instanceof Error) return error.message;
  return 'Something went wrong. Please try again.';
}

export default function TrainersPage() {
  const [editing, setEditing] = useState<Trainer | null>(null);
  const [creating, setCreating] = useState(false);
  const [invitationUrl, setInvitationUrl] = useState<string | null>(null);
  const query = useTrainers();
  const create = useCreateTrainer();
  const update = useUpdateTrainer();
  const status = useUpdateTrainerStatus();
  const reissue = useReissueTrainerInvitation();
  const saving = create.isPending || update.isPending;
  const mutationError = create.error ?? update.error ?? status.error ?? reissue.error;

  async function submit(values: TrainerFormValues) {
    const input: TrainerInput = {
      email: values.email,
      name: values.name,
      bio: values.bio || null,
      hourlyRateMinor: values.hourlyRate === '' ? null : Math.round(Number(values.hourlyRate) * 100),
      currency: values.currency,
    };
    try {
      if (editing) {
        await update.mutateAsync({ id: editing.id, input });
      } else {
        const result = await create.mutateAsync(input);
        setInvitationUrl(result.invitationUrl);
      }
      setEditing(null);
      setCreating(false);
    } catch {
      // Render the mutation error below the form.
    }
  }

  async function toggle(trainer: Trainer) {
    try { await status.mutateAsync({ id: trainer.id, isActive: !trainer.isActive }); } catch { /* shown below */ }
  }

  async function reissueInvite(trainer: Trainer) {
    try {
      const result = await reissue.mutateAsync(trainer.id);
      setInvitationUrl(result.invitationUrl);
    } catch { /* shown below */ }
  }

  const showForm = creating || editing !== null;

  return <section className="space-y-6">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-sm font-medium text-academy-green">People</p>
        <h2 className="mt-1 text-2xl font-semibold text-academy-ink">Trainers</h2>
        <p className="mt-2 text-sm text-academy-muted">Manage trainer profiles, hourly rates, and account invitations.</p>
      </div>
      {!showForm && <button type="button" onClick={() => { create.reset(); setCreating(true); }} className="rounded-lg bg-academy-green px-4 py-2.5 text-sm font-semibold text-white">Add trainer</button>}
    </div>

    {invitationUrl && <div className="rounded-xl border border-academy-line bg-white p-5">
      <div className="flex items-start justify-between gap-4">
        <div><h3 className="font-semibold text-academy-ink">Trainer invitation created</h3>
          <p className="mt-1 text-sm text-academy-muted">Copy this link and send it to the trainer. It expires after seven days and can only be used once.</p>
        </div>
        <button type="button" onClick={() => setInvitationUrl(null)} className="text-sm text-academy-muted">Dismiss</button>
      </div>
      <p className="mt-3 break-all rounded-lg bg-academy-paper p-3 text-sm">{invitationUrl}</p>
      <button type="button" onClick={() => void navigator.clipboard.writeText(invitationUrl)} className="mt-3 rounded-lg border border-academy-line px-3 py-2 text-sm font-medium">Copy invitation link</button>
    </div>}

    {showForm && <div className="max-w-xl">
      <TrainerForm trainer={editing ?? undefined} isSubmitting={saving} onCancel={() => { setEditing(null); setCreating(false); create.reset(); update.reset(); }} onSubmit={submit} />
    </div>}

    {mutationError && <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{errorMessage(mutationError)}</p>}
    {query.isPending && <p className="rounded-xl border border-academy-line bg-white p-8 text-center text-sm text-academy-muted">Loading trainers…</p>}
    {query.isError && <div role="alert" className="rounded-xl bg-red-50 p-5 text-sm text-red-700">{errorMessage(query.error)} <button type="button" onClick={() => void query.refetch()} className="ml-2 underline">Retry</button></div>}
    {query.isSuccess && <>
      <div className="flex justify-between text-sm text-academy-muted"><span>{query.data.length} trainers</span><span>{query.data.filter((trainer) => trainer.isActive).length} active</span></div>
      <TrainersTable trainers={query.data} busyId={status.isPending ? status.variables?.id : reissue.isPending ? reissue.variables : undefined} onEdit={(trainer) => { setCreating(false); update.reset(); setEditing(trainer); }} onToggleStatus={toggle} onReissue={reissueInvite} />
    </>}
  </section>;
}
