import { PrismaClient, UserRole } from '@prisma/client';
import * as argon2 from 'argon2';
import { z } from 'zod';

const prisma = new PrismaClient();

const credentialsSchema = z.object({
  ADMIN_EMAIL: z.string().trim().email().max(254),
  ADMIN_NAME: z.string().trim().min(1).max(100),
  ADMIN_PASSWORD: z.string().min(12).max(128),
});

async function main(): Promise<void> {
  const parsed = credentialsSchema.safeParse(process.env);

  if (!parsed.success) {
    throw new Error(
      'Invalid administrator credentials. Set ADMIN_EMAIL to a valid email, ADMIN_NAME to a non-empty name, and ADMIN_PASSWORD to 12–128 characters.',
    );
  }

  const email = parsed.data.ADMIN_EMAIL.toLowerCase();
  const name = parsed.data.ADMIN_NAME;
  const passwordHash = await argon2.hash(parsed.data.ADMIN_PASSWORD, {
    type: argon2.argon2id,
  });

  const admin = await prisma.$transaction(async (tx) => {
    const user = await tx.user.upsert({
      where: { email },
      update: {
        name,
        role: UserRole.ADMIN,
        isActive: true,
        passwordHash,
      },
      create: {
        email,
        name,
        role: UserRole.ADMIN,
        isActive: true,
        passwordHash,
      },
    });

    // Revoke prior sessions after changing credentials or elevating a role.
    await tx.authSession.deleteMany({
      where: { userId: user.id },
    });

    return user;
  });

  console.log(`Administrator account provisioned: ${admin.email}`);
}

main()
  .catch((error: unknown) => {
    console.error('Administrator provisioning failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
