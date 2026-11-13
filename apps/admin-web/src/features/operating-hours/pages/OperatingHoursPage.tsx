import { useEffect, useMemo, useState } from 'react';
import { ApiError } from '../../../lib/api-client';
import { useAdminCourts } from '../../courts/courts.queries';
import WeeklyScheduleEditor from '../components/WeeklyScheduleEditor';
import {
  useCourtOperatingHours,
  useReplaceCourtOperatingHours,
} from '../operating-hours.queries';
import type { OperatingHourInput } from '../operating-hours.types';

function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return 'Something went wrong. Please try again.';
}

export default function OperatingHoursPage() {
  const courtsQuery = useAdminCourts();
  const [selectedCourtId, setSelectedCourtId] = useState('');
  const [draft, setDraft] = useState<OperatingHourInput[]>([]);
  const scheduleQuery = useCourtOperatingHours(selectedCourtId || undefined);
  const saveMutation = useReplaceCourtOperatingHours();

  const selectedCourt = useMemo(
    () => courtsQuery.data?.find((court) => court.id === selectedCourtId),
    [courtsQuery.data, selectedCourtId],
  );

  useEffect(() => {
    if (!selectedCourtId && courtsQuery.data?.length) {
      setSelectedCourtId(courtsQuery.data[0].id);
    }
  }, [courtsQuery.data, selectedCourtId]);

  useEffect(() => {
    if (scheduleQuery.data) {
      setDraft(scheduleQuery.data.map(({ dayOfWeek, startMinute, endMinute }) => ({
        dayOfWeek,
        startMinute,
        endMinute,
      })));
    }
  }, [scheduleQuery.data]);

  async function handleSave() {
    if (!selectedCourtId) return;
    try {
      await saveMutation.mutateAsync({
        courtId: selectedCourtId,
        input: { intervals: draft },
      });
    } catch {
      // The mutation error is displayed below the editor.
    }
  }

  return (
    <section className="space-y-6">
      <div>
        <p className="text-sm font-medium text-academy-green">Facilities</p>
        <h2 className="mt-1 text-2xl font-semibold text-academy-ink">Operating hours</h2>
        <p className="mt-2 text-sm text-academy-muted">
          Set the weekly opening schedule for each court. You can add multiple sessions per day.
        </p>
      </div>

      {courtsQuery.isPending && (
        <p className="rounded-xl border border-academy-line bg-white p-6 text-sm text-academy-muted">Loading courts…</p>
      )}
      {courtsQuery.isError && (
        <p role="alert" className="rounded-lg bg-red-50 p-4 text-sm text-red-700">{getErrorMessage(courtsQuery.error)}</p>
      )}
      {courtsQuery.isSuccess && courtsQuery.data.length === 0 && (
        <p className="rounded-xl border border-academy-line bg-white p-6 text-sm text-academy-muted">Add a court before configuring its operating hours.</p>
      )}

      {courtsQuery.data && courtsQuery.data.length > 0 && (
        <>
          <div className="max-w-sm">
            <label htmlFor="operating-hours-court" className="text-sm font-medium text-academy-ink">Court</label>
            <select
              id="operating-hours-court"
              value={selectedCourtId}
              onChange={(event) => {
                setSelectedCourtId(event.target.value);
                saveMutation.reset();
              }}
              className="mt-1 block w-full rounded-lg border border-academy-line bg-white px-3 py-2.5 text-sm text-academy-ink"
            >
              {courtsQuery.data.map((court) => (
                <option key={court.id} value={court.id}>{court.name}{court.isActive ? '' : ' (inactive)'}</option>
              ))}
            </select>
          </div>

          {scheduleQuery.isPending && <p className="text-sm text-academy-muted">Loading schedule…</p>}
          {scheduleQuery.isError && (
            <p role="alert" className="rounded-lg bg-red-50 p-4 text-sm text-red-700">{getErrorMessage(scheduleQuery.error)}</p>
          )}
          {scheduleQuery.isSuccess && selectedCourt && (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="font-semibold text-academy-ink">{selectedCourt.name} weekly schedule</h3>
                  <p className="text-xs text-academy-muted">Times use the academy timezone (Asia/Yerevan).</p>
                </div>
                <span className="text-xs text-academy-muted">No intervals means closed all day</span>
              </div>
              <WeeklyScheduleEditor
                intervals={draft}
                onChange={(next) => {
                  setDraft(next);
                  saveMutation.reset();
                }}
                disabled={saveMutation.isPending}
              />
              {saveMutation.error && (
                <p role="alert" className="rounded-lg bg-red-50 p-4 text-sm text-red-700">{getErrorMessage(saveMutation.error)}</p>
              )}
              {saveMutation.isSuccess && (
                <p role="status" className="rounded-lg bg-emerald-50 p-4 text-sm text-emerald-700">Operating hours saved.</p>
              )}
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saveMutation.isPending || scheduleQuery.isFetching}
                  className="rounded-lg bg-academy-green px-5 py-2.5 text-sm font-semibold text-white hover:bg-academy-ink disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saveMutation.isPending ? 'Saving…' : 'Save operating hours'}
                </button>
              </div>
            </>
          )}
        </>
      )}
    </section>
  );
}
