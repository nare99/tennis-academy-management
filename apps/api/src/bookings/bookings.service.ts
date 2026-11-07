
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import {
  Prisma,
  UserRole,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PublicUser } from '../auth/auth.types';
import { CreateBookingDto } from './dto/create-booking.dto';
import { BookingPricingService } from './booking-pricing.service';
import { BookingScheduleService } from './booking-schedule.service';
import { getLocalDateTimeParts } from './booking-time.utils';

@Injectable()
export class BookingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pricingService: BookingPricingService,
    private readonly scheduleService: BookingScheduleService,
  ) {}

  async create(
    user: PublicUser,
    dto: CreateBookingDto,
  ) {
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
      throw new NotFoundException(
        'Active court not found.',
      );
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

    const startLocalMinute =
      startAt.getUTCMinutes();

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
