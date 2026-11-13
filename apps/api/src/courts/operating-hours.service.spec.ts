import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OperatingHoursService } from './operating-hours.service';

describe('OperatingHoursService', () => {
  const tx = {
    courtOperatingHours: {
      deleteMany: jest.fn(),
      createMany: jest.fn(),
    },
  };
  const prisma = {
    court: { findUnique: jest.fn() },
    courtOperatingHours: { findMany: jest.fn() },
    $transaction: jest.fn(),
  };

  let service: OperatingHoursService;

  beforeEach(() => {
    jest.resetAllMocks();
    prisma.$transaction.mockImplementation(
      (callback: (transaction: typeof tx) => Promise<void>) => callback(tx),
    );
    service = new OperatingHoursService(prisma as unknown as PrismaService);
  });

  it('returns a court schedule ordered by day and opening time', async () => {
    prisma.court.findUnique.mockResolvedValue({ id: 'court-1' });
    prisma.courtOperatingHours.findMany.mockResolvedValue([]);

    await expect(service.findForCourt('court-1')).resolves.toEqual([]);
    expect(prisma.courtOperatingHours.findMany).toHaveBeenCalledWith({
      where: { courtId: 'court-1' },
      orderBy: [{ dayOfWeek: 'asc' }, { startMinute: 'asc' }],
    });
  });

  it('returns not found for a missing court', async () => {
    prisma.court.findUnique.mockResolvedValue(null);

    await expect(service.findForCourt('missing')).rejects.toThrow(NotFoundException);
  });

  it('replaces all intervals atomically', async () => {
    prisma.court.findUnique.mockResolvedValue({ id: 'court-1' });
    prisma.courtOperatingHours.findMany.mockResolvedValue([]);
    const intervals = [
      { dayOfWeek: 'MONDAY' as const, startMinute: 540, endMinute: 780 },
      { dayOfWeek: 'MONDAY' as const, startMinute: 840, endMinute: 1320 },
    ];

    await service.replaceForCourt('court-1', { intervals });

    expect(tx.courtOperatingHours.deleteMany).toHaveBeenCalledWith({
      where: { courtId: 'court-1' },
    });
    expect(tx.courtOperatingHours.createMany).toHaveBeenCalledWith({
      data: intervals.map((interval) => ({ ...interval, courtId: 'court-1' })),
    });
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
  });

  it('allows an empty schedule to mark the court closed all week', async () => {
    prisma.court.findUnique.mockResolvedValue({ id: 'court-1' });
    prisma.courtOperatingHours.findMany.mockResolvedValue([]);

    await service.replaceForCourt('court-1', { intervals: [] });

    expect(tx.courtOperatingHours.deleteMany).toHaveBeenCalled();
    expect(tx.courtOperatingHours.createMany).not.toHaveBeenCalled();
  });

  it('rejects intervals whose end is not after their start', async () => {
    prisma.court.findUnique.mockResolvedValue({ id: 'court-1' });

    await expect(service.replaceForCourt('court-1', {
      intervals: [{ dayOfWeek: 'MONDAY', startMinute: 600, endMinute: 600 }],
    })).rejects.toThrow(BadRequestException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('rejects overlapping intervals on the same day', async () => {
    prisma.court.findUnique.mockResolvedValue({ id: 'court-1' });

    await expect(service.replaceForCourt('court-1', {
      intervals: [
        { dayOfWeek: 'MONDAY', startMinute: 540, endMinute: 780 },
        { dayOfWeek: 'MONDAY', startMinute: 720, endMinute: 840 },
      ],
    })).rejects.toThrow('Opening intervals overlap on MONDAY.');
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('allows adjacent intervals and intervals on different days', async () => {
    prisma.court.findUnique.mockResolvedValue({ id: 'court-1' });
    prisma.courtOperatingHours.findMany.mockResolvedValue([]);

    await expect(service.replaceForCourt('court-1', {
      intervals: [
        { dayOfWeek: 'MONDAY', startMinute: 540, endMinute: 780 },
        { dayOfWeek: 'MONDAY', startMinute: 780, endMinute: 900 },
        { dayOfWeek: 'TUESDAY', startMinute: 540, endMinute: 900 },
      ],
    })).resolves.toEqual([]);
  });
});
