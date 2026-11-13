import { useState } from 'react';

import { ApiError } from '../../../lib/api-client';
import CourtForm from '../components/CourtForm';
import CourtsTable from '../components/CourtsTable';
import type { CourtFormValues } from '../courts.schemas';
import {
  useAdminCourts,
  useCreateCourt,
  useUpdateCourt,
  useUpdateCourtStatus,
} from '../courts.queries';
import type { Court } from '../courts.types';

function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return 'Something went wrong. Please try again.';
}

export default function CourtsPage() {
  const [editingCourt, setEditingCourt] = useState<Court | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const courtsQuery = useAdminCourts();
  const createMutation = useCreateCourt();
  const updateMutation = useUpdateCourt();
  const statusMutation = useUpdateCourtStatus();

  const isSaving = createMutation.isPending || updateMutation.isPending;
  const formError = createMutation.error ?? updateMutation.error;
  const mutationError = statusMutation.error;

  async function handleFormSubmit(values: CourtFormValues) {
    const input = {
      name: values.name,
      surface: values.surface,
      isIndoor: values.isIndoor,
    };

    try {
      if (editingCourt) {
        await updateMutation.mutateAsync({ id: editingCourt.id, input });
      } else {
        await createMutation.mutateAsync(input);
      }
      setEditingCourt(null);
      setIsCreating(false);
    } catch {
      // The mutation error is rendered next to the form.
    }
  }

  async function handleToggleStatus(court: Court) {
    try {
      await statusMutation.mutateAsync({
        id: court.id,
        input: { isActive: !court.isActive },
      });
    } catch {
      // The mutation error is rendered above the table.
    }
  }

  function closeForm() {
    setEditingCourt(null);
    setIsCreating(false);
    createMutation.reset();
    updateMutation.reset();
  }

  const showForm = isCreating || editingCourt !== null;

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-academy-green">Facilities</p>
          <h2 className="mt-1 text-2xl font-semibold text-academy-ink">Courts</h2>
          <p className="mt-2 text-sm text-academy-muted">
            Manage court details and availability status for your academy.
          </p>
        </div>
        {!showForm && (
          <button
            type="button"
            onClick={() => {
              createMutation.reset();
              setIsCreating(true);
            }}
            className="inline-flex items-center justify-center rounded-lg bg-academy-green px-4 py-2.5 text-sm font-semibold text-white hover:bg-academy-ink"
          >
            Add court
          </button>
        )}
      </div>

      {showForm && (
        <div className="max-w-xl">
          <CourtForm
            court={editingCourt ?? undefined}
            isSubmitting={isSaving}
            onCancel={closeForm}
            onSubmit={handleFormSubmit}
          />
          {formError && (
            <p role="alert" className="mt-3 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
              {getErrorMessage(formError)}
            </p>
          )}
        </div>
      )}

      {mutationError && (
        <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {getErrorMessage(mutationError)}
        </p>
      )}

      {courtsQuery.isPending && (
        <div className="rounded-xl border border-academy-line bg-white px-6 py-12 text-center text-sm text-academy-muted">
          Loading courts…
        </div>
      )}

      {courtsQuery.isError && (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-6 py-5">
          <p className="font-medium text-red-800">Could not load courts</p>
          <p className="mt-1 text-sm text-red-700">{getErrorMessage(courtsQuery.error)}</p>
          <button
            type="button"
            onClick={() => void courtsQuery.refetch()}
            className="mt-3 text-sm font-semibold text-red-800 underline"
          >
            Try again
          </button>
        </div>
      )}

      {courtsQuery.isSuccess && (
        <>
          <div className="flex items-center justify-between text-sm text-academy-muted">
            <span>{courtsQuery.data.length} {courtsQuery.data.length === 1 ? 'court' : 'courts'}</span>
            <span>{courtsQuery.data.filter((court) => court.isActive).length} active</span>
          </div>
          <CourtsTable
            courts={courtsQuery.data}
            updatingCourtId={statusMutation.isPending ? statusMutation.variables?.id : undefined}
            onEdit={(court) => {
              updateMutation.reset();
              setIsCreating(false);
              setEditingCourt(court);
            }}
            onToggleStatus={handleToggleStatus}
          />
        </>
      )}
    </section>
  );
}
