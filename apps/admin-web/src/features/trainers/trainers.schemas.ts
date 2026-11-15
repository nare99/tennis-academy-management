import { z } from 'zod';

export const trainerSchema = z.object({
  email: z.string().trim().email('Enter a valid email address.').max(254),
  name: z.string().trim().min(2, 'Name must contain at least 2 characters.').max(100),
  bio: z.string().trim().max(2000, 'Bio must be 2,000 characters or fewer.'),
  hourlyRate: z.string().refine(
    (value) => value === '' || (/^\d+(\.\d{1,2})?$/.test(value) && Number(value) <= 20_000_000),
    'Enter a valid non-negative hourly rate.',
  ),
  currency: z.string().regex(/^[A-Z]{3}$/, 'Use a three-letter currency code.'),
});

export type TrainerFormValues = z.infer<typeof trainerSchema>;
