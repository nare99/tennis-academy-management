
import {
  BadRequestException,
  Injectable,
} from '@nestjs/common';
import { CourtOperatingHours, DayOfWeek } from '@prisma/client';
import {
  addLocalDays,
  getLocalDateTimeParts,
  getLocalMinuteOfDay,
  getLocalWeekday,
  localDateTimeToUtc,
} from './booking-time.utils';

@Injectable()
export class BookingScheduleService {
  validateBookingWithinOpeningHours(
    startAt: Date,
    endAt: Date,
    timeZone: string,
    operatingHours: CourtOperatingHours[],
  ): void {
    let current = new Date(startAt);

    while (current.getTime() < endAt.getTime()) {
      const local = getLocalDateTimeParts(current, timeZone);
      const weekday = getLocalWeekday(local) as DayOfWeek;

      const nextDay = addLocalDays(local, 1);
      const nextMidnight = localDateTimeToUtc(
        nextDay,
        0,
        timeZone,
      );

      const daySegmentEnd =
        nextMidnight.getTime() < endAt.getTime()
          ? nextMidnight
          : endAt;

      const startMinute = getLocalMinuteOfDay(local);

      const endMinute =
        daySegmentEnd.getTime() === nextMidnight.getTime()
          ? 1440
          : getLocalMinuteOfDay(
              getLocalDateTimeParts(daySegmentEnd, timeZone),
            );

      const intervals = operatingHours
        .filter((interval) => interval.dayOfWeek === weekday)
        .sort((a, b) => a.startMinute - b.startMinute);

      if (!this.isCoveredByIntervals(startMinute, endMinute, intervals)) {
        throw new BadRequestException(
          `The court is not open for the entire requested period on ${weekday}.`,
        );
      }

      current = daySegmentEnd;
    }
  }

  private isCoveredByIntervals(
    requestedStart: number,
    requestedEnd: number,
    intervals: CourtOperatingHours[],
  ): boolean {
    let coveredUntil = requestedStart;

    for (const interval of intervals) {
      // This interval starts after a real closed gap.
      if (interval.startMinute > coveredUntil) {
        break;
      }

      // Extend coverage, including across adjacent intervals.
      if (interval.endMinute > coveredUntil) {
        coveredUntil = interval.endMinute;
      }

      if (coveredUntil >= requestedEnd) {
        return true;
      }
    }

    return false;
  }
}
