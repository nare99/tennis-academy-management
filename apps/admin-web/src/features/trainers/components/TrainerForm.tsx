import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { trainerSchema, type TrainerFormValues } from '../trainers.schemas';
import type { Trainer } from '../trainers.types';

type Props = {
  trainer?: Trainer;
  isSubmitting: boolean;
  onCancel: () => void;
  onSubmit: (values: TrainerFormValues) => void;
};

export default function TrainerForm({ trainer, isSubmitting, onCancel, onSubmit }: Props) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<TrainerFormValues>({
    resolver: zodResolver(trainerSchema),
    defaultValues: {
      email: trainer?.email ?? '',
      name: trainer?.name ?? '',
      bio: trainer?.trainerProfile?.bio ?? '',
      hourlyRate: trainer?.trainerProfile?.hourlyRateMinor == null
        ? ''
        : String(trainer.trainerProfile.hourlyRateMinor / 100),
      currency: trainer?.trainerProfile?.currency ?? 'AMD',
    },
  });

  useEffect(() => {
    reset({
      email: trainer?.email ?? '',
      name: trainer?.name ?? '',
      bio: trainer?.trainerProfile?.bio ?? '',
      hourlyRate: trainer?.trainerProfile?.hourlyRateMinor == null
        ? ''
        : String(trainer.trainerProfile.hourlyRateMinor / 100),
      currency: trainer?.trainerProfile?.currency ?? 'AMD',
    });
  }, [trainer, reset]);

  const fieldClass = 'mt-1 block w-full rounded-lg border border-academy-line bg-white px-3 py-2.5 text-sm outline-none focus:border-academy-green focus:ring-2 focus:ring-academy-green/15';

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 rounded-xl border border-academy-line bg-white p-5 shadow-sm">
      <div>
        <h3 className="font-semibold text-academy-ink">{trainer ? 'Edit trainer' : 'Add a trainer'}</h3>
        <p className="mt-1 text-sm text-academy-muted">
          {trainer ? 'Update trainer and profile details.' : 'The trainer will receive an invitation link to set their own password.'}
        </p>
      </div>
      <div>
        <label htmlFor="trainer-name" className="text-sm font-medium">Full name</label>
        <input id="trainer-name" {...register('name')} className={fieldClass} maxLength={100} />
        {errors.name && <p role="alert" className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
      </div>
      <div>
        <label htmlFor="trainer-email" className="text-sm font-medium">Email</label>
        <input id="trainer-email" type="email" {...register('email')} className={fieldClass} maxLength={254} />
        {errors.email && <p role="alert" className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
      </div>
      <div>
        <label htmlFor="trainer-bio" className="text-sm font-medium">Bio</label>
        <textarea id="trainer-bio" {...register('bio')} className={fieldClass} rows={3} maxLength={2000} />
        {errors.bio && <p role="alert" className="mt-1 text-xs text-red-600">{errors.bio.message}</p>}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="trainer-rate" className="text-sm font-medium">Hourly rate</label>
          <input id="trainer-rate" inputMode="decimal" {...register('hourlyRate')} className={fieldClass} placeholder="e.g. 5000" />
          {errors.hourlyRate && <p role="alert" className="mt-1 text-xs text-red-600">{errors.hourlyRate.message}</p>}
        </div>
        <div>
          <label htmlFor="trainer-currency" className="text-sm font-medium">Currency</label>
          <input id="trainer-currency" {...register('currency')} className={fieldClass} maxLength={3} />
          {errors.currency && <p role="alert" className="mt-1 text-xs text-red-600">{errors.currency.message}</p>}
        </div>
      </div>
      <div className="flex justify-end gap-3 border-t border-academy-line pt-4">
        <button type="button" onClick={onCancel} disabled={isSubmitting} className="rounded-lg border border-academy-line px-4 py-2 text-sm">Cancel</button>
        <button type="submit" disabled={isSubmitting} className="rounded-lg bg-academy-green px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
          {isSubmitting ? 'Saving…' : trainer ? 'Save changes' : 'Create trainer'}
        </button>
      </div>
    </form>
  );
}
