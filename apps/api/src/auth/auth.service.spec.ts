
import {
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { Prisma, UserRole } from '@prisma/client';
import * as argon2 from 'argon2';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: {
    user: {
      create: jest.Mock;
      findUnique: jest.Mock;
    };
    authSession: {
      create: jest.Mock;
      deleteMany: jest.Mock;
      findUnique: jest.Mock;
    };
    $transaction: jest.Mock;
  };

  const user = {
    id: 'user-1',
    email: 'customer@example.com',
    name: 'Test Customer',
    role: UserRole.CUSTOMER,
    isActive: true,
    passwordHash: null as string | null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    prisma = {
      user: {
        create: jest.fn(),
        findUnique: jest.fn(),
      },
      authSession: {
        create: jest.fn(),
        deleteMany: jest.fn(),
        findUnique: jest.fn(),
      },
      $transaction: jest.fn(),
    };

    service = new AuthService(prisma as unknown as PrismaService);
  });

  describe('register', () => {
    it('creates a customer and returns no password hash', async () => {
      prisma.$transaction.mockImplementation(
        async (callback: (tx: unknown) => Promise<unknown>) =>
          callback({
            user: { create: jest.fn().mockResolvedValue(user) },
            authSession: { create: jest.fn().mockResolvedValue({}) },
          }),
      );

      const result = await service.register({
        email: ' CUSTOMER@example.com ',
        name: ' Test Customer ',
        password: 'a-strong-test-password',
      });

      expect(result.user.role).toBe(UserRole.CUSTOMER);
      expect(result.user.email).toBe('customer@example.com');
      expect(result.user).not.toHaveProperty('passwordHash');
      expect(result.session.token).toBeTruthy();
      expect(result.session.expiresAt.getTime()).toBeGreaterThan(Date.now());
    });

    it('rejects an email that already exists', async () => {
      prisma.$transaction.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError(
          'Unique constraint failed',
          { code: 'P2002', clientVersion: '6.19.3' },
        ),
      );

      await expect(
        service.register({
          email: 'customer@example.com',
          name: 'Test Customer',
          password: 'a-strong-test-password',
        }),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('login', () => {
    it('rejects an unknown email', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.login({
          email: 'unknown@example.com',
          password: 'a-strong-test-password',
        }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('rejects an incorrect password', async () => {
      const passwordHash = await argon2.hash('correct-test-password');
      prisma.user.findUnique.mockResolvedValue({
        ...user,
        passwordHash,
      });

      await expect(
        service.login({
          email: user.email,
          password: 'incorrect-test-password',
        }),
      ).rejects.toBeInstanceOf(UnauthorizedException);

      expect(prisma.authSession.create).not.toHaveBeenCalled();
    });

    it('rejects an inactive account', async () => {
      prisma.user.findUnique.mockResolvedValue({
        ...user,
        isActive: false,
        passwordHash: await argon2.hash('correct-test-password'),
      });

      await expect(
        service.login({
          email: user.email,
          password: 'correct-test-password',
        }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });
  });

  describe('sessions', () => {
    it('revokes a session by its token hash', async () => {
      prisma.authSession.deleteMany.mockResolvedValue({ count: 1 });

      await service.logout('test-session-token');

      expect(prisma.authSession.deleteMany).toHaveBeenCalledWith({
        where: {
          tokenHash: expect.any(String),
        },
      });

      const where =
        prisma.authSession.deleteMany.mock.calls[0][0].where;

      expect(where.tokenHash).not.toBe('test-session-token');
    });

    it('rejects an expired session', async () => {
      prisma.authSession.findUnique.mockResolvedValue({
        id: 'session-1',
        tokenHash: 'stored-hash',
        userId: user.id,
        expiresAt: new Date(Date.now() - 60_000),
        createdAt: new Date(),
        user,
      });
      prisma.authSession.deleteMany.mockResolvedValue({ count: 1 });

      const result = await service.validateSession('expired-token');

      expect(result).toBeNull();
      expect(prisma.authSession.deleteMany).toHaveBeenCalledWith({
        where: { id: 'session-1' },
      });
    });

    it('rejects a session belonging to an inactive account', async () => {
      prisma.authSession.findUnique.mockResolvedValue({
        id: 'session-2',
        tokenHash: 'stored-hash',
        userId: user.id,
        expiresAt: new Date(Date.now() + 60_000),
        createdAt: new Date(),
        user: { ...user, isActive: false },
      });

      const result = await service.validateSession('valid-format-token');

      expect(result).toBeNull();
    });
  });
});
