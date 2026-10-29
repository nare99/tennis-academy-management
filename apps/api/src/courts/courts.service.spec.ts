
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CourtsService } from './courts.service';

describe('CourtsService', () => {
  const prisma = {
    court: {
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  let service: CourtsService;

  beforeEach(() => {
    jest.resetAllMocks();
    service = new CourtsService(prisma as unknown as PrismaService);
  });

  function prismaError(code: 'P2002' | 'P2025') {
    return new Prisma.PrismaClientKnownRequestError(
      'Mock Prisma error',
      {
        code,
        clientVersion: '6.19.3',
      },
    );
  }

  it('lists only active courts for public requests', async () => {
    prisma.court.findMany.mockResolvedValue([]);

    await expect(service.findActive()).resolves.toEqual([]);

    expect(prisma.court.findMany).toHaveBeenCalledWith({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
  });

  it('lists all courts for admin requests', async () => {
    prisma.court.findMany.mockResolvedValue([]);

    await expect(service.findAll()).resolves.toEqual([]);

    expect(prisma.court.findMany).toHaveBeenCalledWith({
      orderBy: { name: 'asc' },
    });
  });

  it('trims the court name and applies creation defaults', async () => {
    const court = {
      id: 'court-1',
      name: 'Court 3',
      surface: null,
      isIndoor: false,
      isActive: true,
    };

    prisma.court.create.mockResolvedValue(court);

    await expect(
      service.create({ name: ' Court 3 ' }),
    ).resolves.toEqual(court);

    expect(prisma.court.create).toHaveBeenCalledWith({
      data: {
        name: 'Court 3',
        surface: null,
        isIndoor: false,
      },
    });
  });

  it('converts duplicate court names into a conflict error', async () => {
    prisma.court.create.mockRejectedValue(prismaError('P2002'));

    await expect(
      service.create({ name: 'Court 1' }),
    ).rejects.toThrow(ConflictException);
  });

  it('rejects updates with no fields', async () => {
    await expect(
      service.update('court-1', {}),
    ).rejects.toThrow(BadRequestException);

    expect(prisma.court.update).not.toHaveBeenCalled();
  });

  it('returns not found when updating a missing court', async () => {
    prisma.court.update.mockRejectedValue(prismaError('P2025'));

    await expect(
      service.update('missing-court', { name: 'Court 4' }),
    ).rejects.toThrow(NotFoundException);
  });

  it('returns not found when changing status on a missing court', async () => {
    prisma.court.update.mockRejectedValue(prismaError('P2025'));

    await expect(
      service.updateStatus('missing-court', false),
    ).rejects.toThrow(NotFoundException);
  });

  it('deactivates a court without deleting it', async () => {
    const court = {
      id: 'court-1',
      name: 'Court 1',
      isActive: false,
    };

    prisma.court.update.mockResolvedValue(court);

    await expect(
      service.updateStatus('court-1', false),
    ).resolves.toEqual(court);

    expect(prisma.court.update).toHaveBeenCalledWith({
      where: { id: 'court-1' },
      data: { isActive: false },
    });
  });
});
