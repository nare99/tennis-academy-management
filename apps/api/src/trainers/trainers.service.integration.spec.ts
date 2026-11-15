import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserRole } from '@prisma/client';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';
import { TrainersService } from './trainers.service';

const describeIfDatabase = process.env.DATABASE_URL ? describe : describe.skip;

describeIfDatabase('TrainersService invitation acceptance (PostgreSQL integration)', () => {
  jest.setTimeout(30_000);
  let prisma: PrismaService | undefined;
  let service: TrainersService;
  let trainerId: string | undefined;

  beforeAll(async () => {
    const connectedPrisma = new PrismaService();
    await connectedPrisma.$connect();
    prisma = connectedPrisma;
    service = new TrainersService(
      connectedPrisma,
      new ConfigService({
        TRAINER_INVITATION_BASE_URL: 'http://localhost:5174/accept-invitation',
      }),
    );
  });

  afterAll(async () => {
    if (!prisma) return;
    if (trainerId) {
      await prisma.user.deleteMany({ where: { id: trainerId } });
    }
    await prisma.$disconnect();
  });

  it('allows exactly one of two concurrent requests to consume the same invitation', async () => {
    const email = `trainer-invitation-race-${randomUUID()}@example.test`;
    const token = randomBytes(32).toString('base64url');
    const tokenHash = createHash('sha256').update(token).digest('hex');

    const trainer = await prisma.user.create({
      data: {
        email,
        name: 'Concurrent Invitation Test',
        role: UserRole.TRAINER,
        isActive: false,
      },
    });
    trainerId = trainer.id;

    const invitation = await prisma.trainerInvitation.create({
      data: {
        userId: trainer.id,
        tokenHash,
        expiresAt: new Date(Date.now() + 60_000),
      },
    });

    const results = await Promise.allSettled([
      service.acceptInvitation({
        token,
        password: 'a-strong-test-password-1',
      }),
      service.acceptInvitation({
        token,
        password: 'a-strong-test-password-2',
      }),
    ]);

    expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1);

    const rejected = results.find((result) => result.status === 'rejected');
    expect(rejected?.status).toBe('rejected');
    if (rejected?.status === 'rejected') {
      expect(rejected.reason).toBeInstanceOf(UnauthorizedException);
    }

    const [storedInvitation, storedTrainer] = await Promise.all([
      prisma.trainerInvitation.findUniqueOrThrow({
        where: { id: invitation.id },
      }),
      prisma.user.findUniqueOrThrow({
        where: { id: trainer.id },
      }),
    ]);

    expect(storedInvitation.consumedAt).toBeInstanceOf(Date);
    expect(storedTrainer.isActive).toBe(true);
    expect(storedTrainer.passwordHash).toBeTruthy();
  });
});
