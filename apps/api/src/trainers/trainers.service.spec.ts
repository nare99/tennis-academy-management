import {
  BadRequestException,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma, UserRole } from '@prisma/client';
import { createHash } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';
import { TrainersService } from './trainers.service';

describe('TrainersService', () => {
  let service: TrainersService;
  let prisma: {
    $transaction: jest.Mock;
    trainerInvitation: { findUnique: jest.Mock };
    user: { findMany: jest.Mock };
  };
  const config = {
    get: jest.fn().mockReturnValue('http://localhost:5174/accept-invitation'),
  };

  beforeEach(() => {
    prisma = {
      $transaction: jest.fn(),
      trainerInvitation: { findUnique: jest.fn() },
      user: { findMany: jest.fn() },
    };
    service = new TrainersService(
      prisma as unknown as PrismaService,
      config as unknown as ConfigService,
    );
    jest.clearAllMocks();
  });

  it('creates an inactive trainer with profile and a hashed invitation', async () => {
    const user = {
      id: 'trainer-1',
      email: 'coach@example.com',
      name: 'Coach One',
      role: UserRole.TRAINER,
      isActive: false,
      passwordHash: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const profile = {
      id: 'profile-1',
      userId: user.id,
      bio: null,
      hourlyRateMinor: 500000,
      currency: 'AMD',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const tx = {
      user: { create: jest.fn().mockResolvedValue(user) },
      trainerProfile: { create: jest.fn().mockResolvedValue(profile) },
      trainerInvitation: {
        create: jest.fn().mockImplementation(({ data }) => Promise.resolve(data)),
      },
    };
    prisma.$transaction.mockImplementation(
      (callback: (tx: unknown) => Promise<unknown>) => callback(tx),
    );

    const result = await service.create({
      email: ' Coach@Example.com ',
      name: ' Coach One ',
      hourlyRateMinor: 500000,
    });

    expect(tx.user.create).toHaveBeenCalledWith({
      data: {
        email: 'coach@example.com',
        name: 'Coach One',
        role: UserRole.TRAINER,
        isActive: false,
      },
    });
    const storedHash = tx.trainerInvitation.create.mock.calls[0][0].data.tokenHash;
    expect(storedHash).not.toBe(new URL(result.invitationUrl).searchParams.get('token'));
    expect(result.trainer.status).toBe('INVITED');
    expect(result.trainer.isActive).toBe(false);
  });

  it('does not allow activating a trainer before invitation acceptance', async () => {
    const tx = {
      user: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'trainer-1',
          passwordHash: null,
        }),
      },
    };
    prisma.$transaction.mockImplementation(
      (callback: (tx: unknown) => Promise<unknown>) => callback(tx),
    );

    await expect(service.updateStatus('trainer-1', true)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('returns the same expired-invitation status after deactivation as findAll', async () => {
    const invitation = {
      expiresAt: new Date(Date.now() + 60_000),
      consumedAt: new Date(),
    };
    const user = {
      id: 'trainer-1',
      email: 'coach@example.com',
      name: 'Coach One',
      role: UserRole.TRAINER,
      isActive: false,
      passwordHash: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      trainerProfile: null,
      trainerInvitations: [invitation],
    };
    const tx = {
      user: {
        findFirst: jest.fn().mockResolvedValue({
          id: user.id,
          passwordHash: null,
        }),
        update: jest.fn().mockResolvedValue(user),
      },
      trainerInvitation: {
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      authSession: {
        deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
    };
    prisma.$transaction.mockImplementation(
      (callback: (tx: unknown) => Promise<unknown>) => callback(tx),
    );

    const result = await service.updateStatus('trainer-1', false);

    expect(tx.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        select: expect.objectContaining({
          trainerInvitations: expect.objectContaining({
            orderBy: { createdAt: 'desc' },
            take: 1,
          }),
        }),
      }),
    );
    expect(result.status).toBe('INVITATION_EXPIRED');

    prisma.user.findMany.mockResolvedValue([user]);
    const [listedTrainer] = await service.findAll();

    if (!listedTrainer) {
      throw new Error('Expected the trainer to be returned by findAll().');
    }

    expect(result.status).toBe(listedTrainer.status);
  });

  it('returns INACTIVE for a deactivated trainer who has already set a password', async () => {
    const user = {
      id: 'trainer-1',
      email: 'coach@example.com',
      name: 'Coach One',
      role: UserRole.TRAINER,
      isActive: false,
      passwordHash: 'argon2-hash',
      trainerInvitations: [],
    };
    const tx = {
      user: {
        findFirst: jest.fn().mockResolvedValue({
          id: user.id,
          passwordHash: user.passwordHash,
        }),
        update: jest.fn().mockResolvedValue(user),
      },
      trainerInvitation: {
        updateMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
      authSession: {
        deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
    };
    prisma.$transaction.mockImplementation(
      (callback: (tx: unknown) => Promise<unknown>) => callback(tx),
    );

    const result = await service.updateStatus('trainer-1', false);

    expect(result.status).toBe('INACTIVE');
  });

  it('updates user fields when the trainer profile does not exist', async () => {
    const user = {
      id: 'trainer-1',
      email: 'coach@example.com',
      name: 'Updated Coach',
      role: UserRole.TRAINER,
      isActive: false,
      passwordHash: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const tx = {
      user: {
        findFirst: jest.fn().mockResolvedValue({
          id: user.id,
          passwordHash: null,
          isActive: false,
          trainerInvitations: [],
        }),
        update: jest.fn().mockResolvedValue(user),
      },
      trainerProfile: {
        findUnique: jest.fn().mockResolvedValue(null),
      },
    };
    prisma.$transaction.mockImplementation(
      (callback: (tx: unknown) => Promise<unknown>) => callback(tx),
    );

    const result = await service.update('trainer-1', { name: 'Updated Coach' });

    expect(tx.trainerProfile.findUnique).toHaveBeenCalledWith({
      where: { userId: 'trainer-1' },
    });
    expect(result.name).toBe('Updated Coach');
    expect(result.trainerProfile).toBeNull();
  });

  it('rejects empty updates', async () => {
    await expect(service.update('trainer-1', {})).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('rejects an invalid invitation token without opening a transaction', async () => {
    prisma.trainerInvitation.findUnique.mockResolvedValue(null);

    await expect(
      service.acceptInvitation({
        token: 'a'.repeat(43),
        password: 'a-strong-test-password',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('rejects an expired invitation before hashing or activating an account', async () => {
    prisma.trainerInvitation.findUnique.mockResolvedValue({
      id: 'expired',
      expiresAt: new Date(Date.now() - 1000),
      consumedAt: null,
      user: { role: UserRole.TRAINER, passwordHash: null },
    });

    await expect(
      service.acceptInvitation({
        token: 'b'.repeat(43),
        password: 'a-strong-test-password',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('accepts a valid invitation, consumes it, and activates the trainer', async () => {
    const token = 'c'.repeat(43);
    const tokenHash = createHash('sha256').update(token).digest('hex');
    const invitation = {
      id: 'invitation-1',
      userId: 'trainer-1',
      expiresAt: new Date(Date.now() + 60_000),
      consumedAt: null,
      user: {
        id: 'trainer-1',
        role: UserRole.TRAINER,
        passwordHash: null,
      },
    };
    const user = {
      id: 'trainer-1',
      email: 'coach@example.com',
      name: 'Coach One',
      role: UserRole.TRAINER,
      isActive: true,
      passwordHash: 'argon2-hash',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    prisma.trainerInvitation.findUnique.mockResolvedValue(invitation);
    const tx = {
      trainerInvitation: {
        findUnique: jest.fn().mockResolvedValue(invitation),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      user: {
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        findUnique: jest.fn().mockResolvedValue(user),
      },
    };
    prisma.$transaction.mockImplementation(
      (callback: (tx: unknown) => Promise<unknown>) => callback(tx),
    );

    const result = await service.acceptInvitation({
      token,
      password: 'a-strong-test-password',
    });

    expect(result.user).toEqual({
      id: user.id,
      email: user.email,
      name: user.name,
      role: UserRole.TRAINER,
      isActive: true,
    });
    expect(tx.trainerInvitation.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { tokenHash } }),
    );
    expect(tx.trainerInvitation.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: 'invitation-1',
          consumedAt: null,
          expiresAt: { gt: expect.any(Date) },
        },
      }),
    );
    expect(tx.user.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: user.id,
          role: UserRole.TRAINER,
          passwordHash: null,
        },
        data: {
          passwordHash: expect.any(String),
          isActive: true,
        },
      }),
    );
  });

  it('maps duplicate email errors to conflict', async () => {
    prisma.$transaction.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002',
        clientVersion: '6.19.3',
      }),
    );

    await expect(
      service.create({ email: 'coach@example.com', name: 'Coach One' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
