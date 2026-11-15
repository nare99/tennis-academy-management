import { BadRequestException, ConflictException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma, UserRole } from '@prisma/client';
import { createHash } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';
import { TrainersService } from './trainers.service';

describe('TrainersService', () => {
  let service: TrainersService;
  let prisma: { $transaction: jest.Mock; trainerInvitation: { findUnique: jest.Mock } };
  const config = { get: jest.fn().mockReturnValue('http://localhost:5174/accept-invitation') };

  beforeEach(() => {
    prisma = { $transaction: jest.fn(), trainerInvitation: { findUnique: jest.fn() } };
    service = new TrainersService(prisma as unknown as PrismaService, config as unknown as ConfigService);
    jest.clearAllMocks();
  });

  it('creates an inactive trainer with profile and hashed invitation', async () => {
    const user = {
      id: 'trainer-1', email: 'coach@example.com', name: 'Coach One',
      role: UserRole.TRAINER, isActive: false, passwordHash: null,
      createdAt: new Date(), updatedAt: new Date(),
    };
    const profile = {
      id: 'profile-1', userId: user.id, bio: null, hourlyRateMinor: 500000,
      currency: 'AMD', createdAt: new Date(), updatedAt: new Date(),
    };
    const tx = {
      user: { create: jest.fn().mockResolvedValue(user) },
      trainerProfile: { create: jest.fn().mockResolvedValue(profile) },
      trainerInvitation: { create: jest.fn().mockImplementation(({ data }) => Promise.resolve(data)) },
    };
    prisma.$transaction.mockImplementation((callback: (tx: unknown) => Promise<unknown>) => callback(tx));

    const result = await service.create({ email: ' Coach@Example.com ', name: ' Coach One ', hourlyRateMinor: 500000 });

    expect(tx.user.create).toHaveBeenCalledWith({
      data: { email: 'coach@example.com', name: 'Coach One', role: UserRole.TRAINER, isActive: false },
    });
    const storedHash = tx.trainerInvitation.create.mock.calls[0][0].data.tokenHash;
    expect(storedHash).not.toBe(new URL(result.invitationUrl).searchParams.get('token'));
    expect(result.trainer.status).toBe('INVITED');
    expect(result.trainer.isActive).toBe(false);
  });

  it('does not allow activating a trainer before invitation acceptance', async () => {
    const tx = { user: { findFirst: jest.fn().mockResolvedValue({ id: 'trainer-1', passwordHash: null }) } };
    prisma.$transaction.mockImplementation((callback: (tx: unknown) => Promise<unknown>) => callback(tx));
    await expect(service.updateStatus('trainer-1', true)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects empty updates', async () => {
    await expect(service.update('trainer-1', {})).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects invalid invitation tokens', async () => {
    const tx = { trainerInvitation: { findUnique: jest.fn().mockResolvedValue(null) } };
    prisma.$transaction.mockImplementation((callback: (tx: unknown) => Promise<unknown>) => callback(tx));
    await expect(service.acceptInvitation({
      token: 'a'.repeat(43), password: 'a-strong-test-password',
    })).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('maps duplicate email errors to conflict', async () => {
    prisma.$transaction.mockRejectedValue(new Prisma.PrismaClientKnownRequestError(
      'Unique constraint failed', { code: 'P2002', clientVersion: '6.19.3' },
    ));
    await expect(service.create({ email: 'coach@example.com', name: 'Coach One' }))
      .rejects.toBeInstanceOf(ConflictException);
  });
});
