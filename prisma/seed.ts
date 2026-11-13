import { PrismaClient, UserRole } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const adminPassword = process.env.ADMIN_SEED_PASSWORD;

  if (!adminPassword) {
    throw new Error(
      'ADMIN_SEED_PASSWORD must be set before running the database seed.',
    );
  }

  const adminPasswordHash = await argon2.hash(adminPassword, {
    type: argon2.argon2id,
  });

  await prisma.user.upsert({
    where: { email: 'admin@tennis-academy.local' },
    update: {
      name: 'Academy Admin',
      role: UserRole.ADMIN,
      isActive: true,
      passwordHash: adminPasswordHash,
    },
    create: {
      email: 'admin@tennis-academy.local',
      name: 'Academy Admin',
      role: UserRole.ADMIN,
      passwordHash: adminPasswordHash,
    },
  });

  await prisma.court.upsert({
    where: { name: 'Court 1' },
    update: { surface: 'Hard', isIndoor: false, isActive: true },
    create: { name: 'Court 1', surface: 'Hard', isIndoor: false },
  });

  await prisma.court.upsert({
    where: { name: 'Court 2' },
    update: { surface: 'Clay', isIndoor: true, isActive: true },
    create: { name: 'Court 2', surface: 'Clay', isIndoor: true },
  });

  console.log('Seed completed: demo admin and two courts are available.');

  await prisma.academySettings.upsert({
    where: { id: 'academy' },
    update: {
      timeZone: 'Asia/Yerevan',
      peakStartMinute: 17 * 60,
      peakEndMinute: 21 * 60,
    },
    create: {
      id: 'academy',
      timeZone: 'Asia/Yerevan',
      peakStartMinute: 17 * 60,
      peakEndMinute: 21 * 60,
    },
  });
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
