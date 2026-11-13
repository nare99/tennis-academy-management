import { z } from 'zod';

export const courtSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Court name must contain at least 2 characters.')
    .max(80, 'Court name must be 80 characters or fewer.'),
  surface: z
    .string()
    .trim()
    .max(50, 'Surface must be 50 characters or fewer.')
    .transform((value) => (value.length > 0 ? value : null)),
  isIndoor: z.boolean(),
});

export type CourtFormValues = z.infer<typeof courtSchema>;
