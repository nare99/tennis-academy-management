
import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { BookingPricingService } from './booking-pricing.service';
import { BookingScheduleService } from './booking-schedule.service';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';

@Module({
  imports: [AuthModule, PrismaModule],
  controllers: [BookingsController],
  providers: [
    BookingsService,
    BookingPricingService,
    BookingScheduleService,
  ],
})
export class BookingsModule {}
