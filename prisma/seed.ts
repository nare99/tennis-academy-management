import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main(): Promise<void> {
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

  console.log('Seed completed: demo courts and academy settings are available.');

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
