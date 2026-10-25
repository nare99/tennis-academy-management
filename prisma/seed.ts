import { PrismaClient, UserRole } from '@prisma/client';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  await prisma.user.upsert({
    where: { email: 'admin@tennis-academy.local' },
    update: { name: 'Academy Admin', role: UserRole.ADMIN, isActive: true },
    create: {
      email: 'admin@tennis-academy.local',
      name: 'Academy Admin',
      role: UserRole.ADMIN,
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
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
