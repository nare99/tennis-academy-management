import { z } from 'zod';

const environmentSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().min(1).max(65535).default(3001),
    DATABASE_URL: z.string().url().startsWith('postgresql://'),
    TRAINER_INVITATION_BASE_URL: z.string().url().optional(),
  })
  .superRefine((environment, context) => {
    const invitationBaseUrl = environment.TRAINER_INVITATION_BASE_URL;

    if (environment.NODE_ENV === 'production' && !invitationBaseUrl) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['TRAINER_INVITATION_BASE_URL'],
        message: 'TRAINER_INVITATION_BASE_URL is required in production.',
      });
      return;
    }

    if (!invitationBaseUrl) return;

    const protocol = new URL(invitationBaseUrl).protocol;
    if (protocol !== 'http:' && protocol !== 'https:') {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['TRAINER_INVITATION_BASE_URL'],
        message: 'TRAINER_INVITATION_BASE_URL must use HTTP or HTTPS.',
      });
    } else if (environment.NODE_ENV === 'production' && protocol !== 'https:') {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['TRAINER_INVITATION_BASE_URL'],
        message: 'TRAINER_INVITATION_BASE_URL must use HTTPS in production.',
      });
    }
  });

export function validateEnvironment(config: Record<string, unknown>) {
  const result = environmentSchema.safeParse(config);
  if (!result.success) {
    throw new Error('Invalid environment configuration: ' + result.error.message);
  }
  return result.data;
}
