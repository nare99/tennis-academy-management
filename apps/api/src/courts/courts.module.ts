
import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { CourtsController } from './courts.controller';
import { CourtsService } from './courts.service';
import { OperatingHoursService } from './operating-hours.service';

@Module({
  imports: [AuthModule, PrismaModule],
  controllers: [CourtsController],
  providers: [CourtsService, OperatingHoursService],
})
export class CourtsModule {}
