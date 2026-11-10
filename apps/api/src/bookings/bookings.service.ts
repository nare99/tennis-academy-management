import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import {
  BookingStatus,
  DayOfWeek,
  Prisma,
  UserRole,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PublicUser } from '../auth/auth.types';
import { CreateBookingDto } from './dto/create-booking.dto';
import { GetAvailabilityQueryDto } from './dto/get-availability-query.dto';
import { BookingPricingService } from './booking-pricing.service';
import { BookingScheduleService } from './booking-schedule.service';
import {
  addLocalDays,
  getLocalDateTimeParts,
  getLocalWeekday,
  localDateTimeToUtc,
} from './booking-time.utils';

const ACTIVE_BOOKING_STATUSES: BookingStatus[] = [
  BookingStatus.PENDING,
  BookingStatus.CONFIRMED,
];

interface AvailableDuration {
  durationMinutes: number;
  endAt: Date;
  priceMinor: number;
  currency: string;
}

export interface AvailableSlot {
  startAt: Date;
  options: AvailableDuration[];
}

@Injectable()
export class BookingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pricingService: BookingPricingService,
    private readonly scheduleService: BookingScheduleService,
  ) {}

  async getAvailability(
    courtId: string,
    query: GetAvailabilityQueryDto,
  ) {
    const date = this.parseLocalDate(query.date);

    const [court, academySettings] = await Promise.all([
      this.prisma.court.findUnique({
        where: { id: courtId },
        include: {
          operatingHours: true,
          pricingRules: true,
        },
      }),
      this.prisma.academySettings.findUnique({
        where: { id: 'academy' },
      }),
    ]);

    if (!court || !court.isActive) {
      throw new NotFoundException('Active court not found.');
    }

    if (!academySettings) {
      throw new InternalServerErrorException(
        'Academy settings have not been configured.',
      );
    }

    const dayStart = localDateTimeToUtc(
      date,
      0,
      academySettings.timeZone,
    );

    const nextDay = addLocalDays(date, 1);

    const dayEnd = localDateTimeToUtc(
      nextDay,
      0,
      academySettings.timeZone,
    );

    // Include bookings beginning shortly after midnight as well,
    // because an available slot may extend into the next local day.
    const searchEnd = new Date(
      dayEnd.getTime() + 24 * 60 * 60 * 1000,
    );

    const existingBookings = await this.prisma.booking.findMany({
      where: {
        courtId,
        status: { in: ACTIVE_BOOKING_STATUSES },
        startAt: { lt: searchEnd },
        endAt: { gt: dayStart },
      },
      select: {
        startAt: true,
        endAt: true,
      },
      orderBy: { startAt: 'asc' },
    });

    const weekday = getLocalWeekday(date) as DayOfWeek;

    const intervals = court.operatingHours
      .filter((interval) => interval.dayOfWeek === weekday)
      .sort((a, b) => a.startMinute - b.startMinute);

    const now = new Date();
    const slots: AvailableSlot[] = [];

    for (const interval of intervals) {
      // The first valid start must be on a local 30-minute boundary.
      const firstStartMinute =
        Math.ceil(interval.startMinute / 30) * 30;

        for (
          let startMinute = firstStartMinute;
          startMinute < interval.endMinute;
          startMinute += 30
        ) {
        const startAt = localDateTimeToUtc(
          date,
          startMinute,
          academySettings.timeZone,
        );

        // Do not advertise slots that have already started.
        if (startAt.getTime() <= now.getTime()) {
          continue;
        }

        const options: AvailableDuration[] = [];

        for (
          let durationMinutes = 60;
          durationMinutes <= 24 * 60;
          durationMinutes += 30
        ) {
          const endAt = new Date(
            startAt.getTime() + durationMinutes * 60_000,
          );

          try {
            this.scheduleService.validateBookingWithinOpeningHours(
              startAt,
              endAt,
              academySettings.timeZone,
              court.operatingHours,
            );
          } catch (error: unknown) {
            if (error instanceof BadRequestException) {
              // Longer durations cannot become valid after a schedule gap.
              break;
            }

            throw error;
          }

          const overlapsExistingBooking = existingBookings.some(
            (booking) =>
              booking.startAt.getTime() < endAt.getTime() &&
              booking.endAt.getTime() > startAt.getTime(),
          );

          if (overlapsExistingBooking) {
            // Every longer duration would also overlap this booking.
            break;
          }

          const price = this.pricingService.calculatePrice(
            startAt,
            endAt,
            academySettings.timeZone,
            academySettings.peakStartMinute,
            academySettings.peakEndMinute,
            court.pricingRules,
          );

          options.push({
            durationMinutes,
            endAt,
            priceMinor: price.priceMinor,
            currency: price.currency,
          });
        }

        if (options.length > 0) {
          slots.push({ startAt, options });
        }
      }
    }

    return {
      court: {
        id: court.id,
        name: court.name,
        surface: court.surface,
        isIndoor: court.isIndoor,
        hasLights: court.hasLights,
      },
      date: query.date,
      timeZone: academySettings.timeZone,
      slots,
    };
  }

  async create(user: PublicUser, dto: CreateBookingDto) {
    if (user.role !== UserRole.CUSTOMER) {
      throw new ForbiddenException(
        'Only customers can create court bookings.',
      );
    }

    const startAt = new Date(dto.startAt);
    const endAt = new Date(dto.endAt);

    this.validateRequestedTime(startAt, endAt);

    const [court, academySettings] = await Promise.all([
      this.prisma.court.findUnique({
        where: { id: dto.courtId },
        include: {
          operatingHours: true,
          pricingRules: true,
        },
      }),
      this.prisma.academySettings.findUnique({
        where: { id: 'academy' },
      }),
    ]);

    if (!court || !court.isActive) {
      throw new NotFoundException('Active court not found.');
    }

    if (!academySettings) {
      throw new InternalServerErrorException(
        'Academy settings have not been configured.',
      );
    }

    const localStart = getLocalDateTimeParts(
      startAt,
      academySettings.timeZone,
    );

    if (localStart.minute % 30 !== 0) {
      throw new BadRequestException(
        'Booking start time must be on a 30-minute boundary in the academy timezone.',
      );
    }

    this.scheduleService.validateBookingWithinOpeningHours(
      startAt,
      endAt,
      academySettings.timeZone,
      court.operatingHours,
    );

    const price = this.pricingService.calculatePrice(
      startAt,
      endAt,
      academySettings.timeZone,
      academySettings.peakStartMinute,
      academySettings.peakEndMinute,
      court.pricingRules,
    );

    try {
      return await this.prisma.booking.create({
        data: {
          customer: {
            connect: { id: user.id },
          },
          court: {
            connect: { id: court.id },
          },
          startAt,
          endAt,
          priceMinor: price.priceMinor,
          currency: price.currency,
        },
        include: {
          court: {
            select: {
              id: true,
              name: true,
              surface: true,
              isIndoor: true,
            },
          },
        },
      });
    } catch (error: unknown) {
      if (this.isBookingOverlapError(error)) {
        throw new ConflictException(
          'This court has already been booked for part or all of the requested time.',
        );
      }

      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2003'
      ) {
        throw new BadRequestException(
          'The selected customer or court is no longer available.',
        );
      }

      throw error;
    }
  }

  async findMine(user: PublicUser) {
    if (user.role !== UserRole.CUSTOMER) {
      throw new ForbiddenException(
        'Only customers can view customer bookings.',
      );
    }

    return this.prisma.booking.findMany({
      where: { customerId: user.id },
      include: {
        court: {
          select: {
            id: true,
            name: true,
            surface: true,
            isIndoor: true,
          },
        },
      },
      orderBy: [{ startAt: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async cancel(user: PublicUser, bookingId: string) {
    if (user.role !== UserRole.CUSTOMER) {
      throw new ForbiddenException(
        'Only customers can cancel their own bookings.',
      );
    }

    const booking = await this.prisma.booking.findFirst({
      where: {
        id: bookingId,
        customerId: user.id,
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found.');
    }

    if (!ACTIVE_BOOKING_STATUSES.includes(booking.status)) {
      throw new ConflictException(
        'This booking is already cancelled.',
      );
    }

    const now = new Date();

    if (booking.startAt.getTime() <= now.getTime()) {
      throw new BadRequestException(
        'A booking cannot be cancelled after it has started.',
      );
    }

    // The conditions are repeated in the update to avoid a race where
    // the booking starts or is cancelled between the read and the update.
    const result = await this.prisma.booking.updateMany({
      where: {
        id: bookingId,
        customerId: user.id,
        status: { in: ACTIVE_BOOKING_STATUSES },
        startAt: { gt: now },
      },
      data: {
        status: BookingStatus.CANCELLED,
      },
    });

    if (result.count === 0) {
      const latestBooking = await this.prisma.booking.findFirst({
        where: {
          id: bookingId,
          customerId: user.id,
        },
      });

      if (!latestBooking) {
        throw new NotFoundException('Booking not found.');
      }

      if (latestBooking.startAt.getTime() <= Date.now()) {
        throw new BadRequestException(
          'A booking cannot be cancelled after it has started.',
        );
      }

      throw new ConflictException(
        'This booking has already been cancelled or changed.',
      );
    }

    return this.prisma.booking.findUniqueOrThrow({
      where: { id: bookingId },
      include: {
        court: {
          select: {
            id: true,
            name: true,
            surface: true,
            isIndoor: true,
          },
        },
      },
    });
  }

  private parseLocalDate(
    value: string,
  ): { year: number; month: number; day: number } {
    const [year, month, day] = value.split('-').map(Number);

    const parsed = new Date(Date.UTC(year!, month! - 1, day!));

    if (
      parsed.getUTCFullYear() !== year ||
      parsed.getUTCMonth() !== month! - 1 ||
      parsed.getUTCDate() !== day
    ) {
      throw new BadRequestException(
        'Date must be a valid calendar date in YYYY-MM-DD format.',
      );
    }

    return { year: year!, month: month!, day: day! };
  }

  private validateRequestedTime(
    startAt: Date,
    endAt: Date,
  ): void {
    if (
      Number.isNaN(startAt.getTime()) ||
      Number.isNaN(endAt.getTime())
    ) {
      throw new BadRequestException(
        'A valid start and end time are required.',
      );
    }

    if (endAt.getTime() <= startAt.getTime()) {
      throw new BadRequestException(
        'Booking end time must be after its start time.',
      );
    }

    const durationMinutes =
      (endAt.getTime() - startAt.getTime()) / 60_000;

    if (
      !Number.isInteger(durationMinutes) ||
      durationMinutes < 60 ||
      durationMinutes % 30 !== 0
    ) {
      throw new BadRequestException(
        'Booking duration must be at least 60 minutes and use 30-minute increments.',
      );
    }

    if (
      startAt.getUTCSeconds() !== 0 ||
      startAt.getUTCMilliseconds() !== 0
    ) {
      throw new BadRequestException(
        'Booking start time must have zero seconds.',
      );
    }
  }

  private isBookingOverlapError(error: unknown): boolean {
    if (
      !(error instanceof Prisma.PrismaClientKnownRequestError) ||
      error.code !== 'P2004'
    ) {
      return false;
    }

    const databaseError = JSON.stringify(error.meta ?? {});

    return (
      databaseError.includes(
        'booking_no_overlapping_active_court_bookings',
      ) ||
      databaseError.includes('23P01') ||
      databaseError.toLowerCase().includes('exclusion constraint')
    );
  }
}
