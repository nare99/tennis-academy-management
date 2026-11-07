import {
  Body,
  Controller,
  InternalServerErrorException,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Request } from 'express';
import { SessionAuthGuard } from '../auth/session-auth.guard';
import { AuthenticatedRequest } from '../auth/auth.types';
import { CreateBookingDto } from './dto/create-booking.dto';
import { BookingsService } from './bookings.service';

@ApiTags('Bookings')
@Controller('bookings')
@UseGuards(SessionAuthGuard)
export class BookingsController {
  constructor(
    private readonly bookingsService: BookingsService,
  ) {}

  @Post()
  @ApiOperation({
    summary: 'Create a court booking for the authenticated customer',
  })
  @ApiCreatedResponse({
    description: 'The booking was created.',
  })
  @ApiUnauthorizedResponse({
    description: 'Authentication is required.',
  })
  @ApiConflictResponse({
    description: 'The court is already booked for the requested time.',
  })
  create(
    @Req() request: Request & AuthenticatedRequest,
    @Body() dto: CreateBookingDto,
  ) {
    if (!request.user) {
      throw new InternalServerErrorException(
        'Authenticated user was not attached to the request.',
      );
    }

    return this.bookingsService.create(request.user, dto);
  }
}
