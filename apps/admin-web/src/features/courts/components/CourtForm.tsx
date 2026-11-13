import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';

import { courtSchema, type CourtFormValues } from '../courts.schemas';
import type { Court } from '../courts.types';

type CourtFormProps = {
  court?: Court;
  isSubmitting: boolean;
  onCancel: () => void;
  onSubmit: (values: CourtFormValues) => void;
};

export default function CourtForm({
  court,
  isSubmitting,
  onCancel,
  onSubmit,
}: CourtFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CourtFormValues>({
    resolver: zodResolver(courtSchema),
    defaultValues: {
      name: court?.name ?? '',
      surface: court?.surface ?? '',
      isIndoor: court?.isIndoor ?? false,
    },
  });

  useEffect(() => {
    reset({
      name: court?.name ?? '',
      surface: court?.surface ?? '',
      isIndoor: court?.isIndoor ?? false,
    });
  }, [court, reset]);

  const fieldClassName =
    'mt-1 block w-full rounded-lg border border-academy-line bg-white px-3 py-2.5 text-sm text-academy-ink outline-none transition focus:border-academy-green focus:ring-2 focus:ring-academy-green/15';

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-5 rounded-xl border border-academy-line bg-white p-5 shadow-sm"
    >
      <div>
        <h3 className="text-base font-semibold text-academy-ink">
          {court ? 'Edit court' : 'Add a court'}
        </h3>
        <p className="mt-1 text-sm text-academy-muted">
          Enter the court details below.
        </p>
      </div>

      <div>
        <label htmlFor="court-name" className="text-sm font-medium text-academy-ink">
          Court name
        </label>
        <input
          id="court-name"
          {...register('name')}
          className={fieldClassName}
          placeholder="e.g. Court 3"
          maxLength={80}
          aria-invalid={Boolean(errors.name)}
        />
        {errors.name && (
          <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="court-surface" className="text-sm font-medium text-academy-ink">
          Surface
        </label>
        <input
          id="court-surface"
          {...register('surface')}
          className={fieldClassName}
          placeholder="e.g. Hard, Clay, Grass"
          maxLength={50}
          aria-invalid={Boolean(errors.surface)}
        />
        {errors.surface && (
          <p className="mt-1 text-xs text-red-600">{errors.surface.message}</p>
        )}
      </div>

      <label className="flex items-center gap-3 text-sm text-academy-ink">
        <input
          type="checkbox"
          {...register('isIndoor')}
          className="h-4 w-4 rounded border-academy-line accent-academy-green"
        />
        Indoor court
      </label>

      <div className="flex justify-end gap-3 border-t border-academy-line pt-4">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="rounded-lg border border-academy-line px-4 py-2 text-sm font-medium text-academy-ink hover:bg-academy-paper disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-lg bg-academy-green px-4 py-2 text-sm font-semibold text-white hover:bg-academy-ink disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? 'Saving…' : court ? 'Save changes' : 'Create court'}
        </button>
      </div>
    </form>
  );
}
