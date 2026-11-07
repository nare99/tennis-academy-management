import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { validateEnvironment } from './config/env.validation';
import { HealthModule } from './health/health.module';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { CourtsModule } from './courts/courts.module';
import { BookingsModule } from './bookings/bookings.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '../../.env',
      validate: validateEnvironment,
    }),
    PrismaModule,
    HealthModule,
    AuthModule,
    CourtsModule,
    BookingsModule,
  ],
})
export class AppModule {}
