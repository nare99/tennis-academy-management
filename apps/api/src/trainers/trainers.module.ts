import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { TrainersController } from './trainers.controller';
import { TrainersService } from './trainers.service';

@Module({
  imports: [AuthModule, PrismaModule],
  controllers: [TrainersController],
  providers: [TrainersService],
})
export class TrainersModule {}
