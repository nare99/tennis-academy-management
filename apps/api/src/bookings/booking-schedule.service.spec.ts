
import { CourtOperatingHours, DayOfWeek } from '@prisma/client';
import { BookingScheduleService } from './booking-schedule.service';

describe('BookingScheduleService', () => {
  let service: BookingScheduleService;

  const makeInterval = (
    startMinute: number,
    endMinute: number,
  ): CourtOperatingHours =>
    ({
      id: `${startMinute}-${endMinute}`,
      courtId: 'court-1',
      dayOfWeek: DayOfWeek.WEDNESDAY,
      startMinute,
      endMinute,
      createdAt: new Date(),
      updatedAt: new Date(),
    }) as CourtOperatingHours;

  beforeEach(() => {
    service = new BookingScheduleService();
  });

  it('accepts a booking fully inside an opening interval', () => {
    expect(() =>
      service.validateBookingWithinOpeningHours(
        new Date('2026-11-11T06:00:00.000Z'), // 10:00
        new Date('2026-11-11T07:00:00.000Z'), // 11:00
        'Asia/Yerevan',
        [makeInterval(9 * 60, 13 * 60)],
      ),
    ).not.toThrow();
  });

  it('rejects a booking that crosses a closed break', () => {
    expect(() =>
      service.validateBookingWithinOpeningHours(
        new Date('2026-11-11T08:00:00.000Z'), // 12:00
        new Date('2026-11-11T09:30:00.000Z'), // 13:30
        'Asia/Yerevan',
        [
          makeInterval(9 * 60, 13 * 60),
          makeInterval(15 * 60, 22 * 60),
        ],
      ),
    ).toThrow('not open for the entire requested period');
  });

  it('accepts a booking spanning adjacent opening intervals', () => {
    expect(() =>
      service.validateBookingWithinOpeningHours(
        new Date('2026-11-11T08:00:00.000Z'), // 12:00
        new Date('2026-11-11T10:00:00.000Z'), // 14:00
        'Asia/Yerevan',
        [
          makeInterval(9 * 60, 13 * 60),
          makeInterval(13 * 60, 17 * 60),
        ],
      ),
    ).not.toThrow();
  });

  it('checks both weekdays when a booking crosses midnight', () => {
    const fridayInterval = {
      ...makeInterval(22 * 60, 1440),
      dayOfWeek: DayOfWeek.FRIDAY,
    };

    const saturdayInterval = {
      ...makeInterval(0, 2 * 60),
      dayOfWeek: DayOfWeek.SATURDAY,
    };

    expect(() =>
      service.validateBookingWithinOpeningHours(
        new Date('2026-11-06T19:00:00.000Z'), // Friday 23:00
        new Date('2026-11-06T21:00:00.000Z'), // Saturday 01:00
        'Asia/Yerevan',
        [fridayInterval, saturdayInterval],
      ),
    ).not.toThrow();
  });
});
