import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CourtOperatingHours, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ReplaceOperatingHoursDto } from './dto/replace-operating-hours.dto';

@Injectable()
export class OperatingHoursService {
  constructor(private readonly prisma: PrismaService) {}

  async findForCourt(courtId: string): Promise<CourtOperatingHours[]> {
    await this.ensureCourtExists(courtId);
    return this.prisma.courtOperatingHours.findMany({
      where: { courtId },
      orderBy: [{ dayOfWeek: 'asc' }, { startMinute: 'asc' }],
    });
  }

  async replaceForCourt(
    courtId: string,
    dto: ReplaceOperatingHoursDto,
  ): Promise<CourtOperatingHours[]> {
    await this.ensureCourtExists(courtId);
    this.validateIntervals(dto.intervals);

    await this.prisma.$transaction(async (tx) => {
      await tx.courtOperatingHours.deleteMany({ where: { courtId } });

      if (dto.intervals.length > 0) {
        await tx.courtOperatingHours.createMany({
          data: dto.intervals.map((interval) => ({
            courtId,
            dayOfWeek: interval.dayOfWeek,
            startMinute: interval.startMinute,
            endMinute: interval.endMinute,
          })),
        });
      }
    });

    return this.prisma.courtOperatingHours.findMany({
      where: { courtId },
      orderBy: [{ dayOfWeek: 'asc' }, { startMinute: 'asc' }],
    });
  }

  private async ensureCourtExists(courtId: string): Promise<void> {
    const court = await this.prisma.court.findUnique({
      where: { id: courtId },
      select: { id: true },
    });

    if (!court) throw new NotFoundException('Court not found.');
  }

  private validateIntervals(
    intervals: ReplaceOperatingHoursDto['intervals'],
  ): void {
    const grouped = new Map<string, typeof intervals>();

    for (const interval of intervals) {
      if (interval.startMinute >= interval.endMinute) {
        throw new BadRequestException(
          'Each opening interval must end after it starts.',
        );
      }

      const dayIntervals = grouped.get(interval.dayOfWeek) ?? [];
      dayIntervals.push(interval);
      grouped.set(interval.dayOfWeek, dayIntervals);
    }

    for (const [day, dayIntervals] of grouped) {
      const sorted = [...dayIntervals].sort(
        (a, b) => a.startMinute - b.startMinute,
      );

      for (let index = 1; index < sorted.length; index += 1) {
        if (sorted[index].startMinute < sorted[index - 1].endMinute) {
          throw new BadRequestException(
            `Opening intervals overlap on ${day}.`,
          );
        }
      }
    }
  }
}
