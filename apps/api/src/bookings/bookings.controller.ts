import {
  Body,
  Controller,
  Get,
  InternalServerErrorException,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Request } from 'express';
import { SessionAuthGuard } from '../auth/session-auth.guard';
import { AuthenticatedRequest } from '../auth/auth.types';
import { CreateBookingDto } from './dto/create-booking.dto';
import { GetAvailabilityQueryDto } from './dto/get-availability-query.dto';
import { BookingsService } from './bookings.service';

@ApiTags('Bookings')
@Controller('bookings')
export class BookingsController {
  constructor(
    private readonly bookingsService: BookingsService,
  ) {}

  @Get('availability/:courtId')
  @ApiOperation({
    summary: 'Get available booking slots and price previews for a court',
  })
  @ApiParam({ name: 'courtId', description: 'Court ID' })
  @ApiQuery({
    name: 'date',
    required: true,
    example: '2026-11-10',
    description: 'Date in the academy timezone, YYYY-MM-DD.',
  })
  getAvailability(
    @Param('courtId') courtId: string,
    @Query() query: GetAvailabilityQueryDto,
  ) {
    return this.bookingsService.getAvailability(courtId, query);
  }

  @Get('mine')
  @UseGuards(SessionAuthGuard)
  @ApiOperation({
    summary: 'Get bookings belonging to the authenticated customer',
  })
  @ApiUnauthorizedResponse({
    description: 'Authentication is required.',
  })
  findMine(@Req() request: Request & AuthenticatedRequest) {
    if (!request.user) {
      throw new InternalServerErrorException(
        'Authenticated user was not attached to the request.',
      );
    }

    return this.bookingsService.findMine(request.user);
  }

  @Post()
  @UseGuards(SessionAuthGuard)
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

  @Patch(':id/cancel')
  @UseGuards(SessionAuthGuard)
  @ApiOperation({
    summary: 'Cancel an upcoming booking belonging to the customer',
  })
  @ApiUnauthorizedResponse({
    description: 'Authentication is required.',
  })
  @ApiConflictResponse({
    description: 'The booking has already been cancelled or changed.',
  })
  cancel(
    @Req() request: Request & AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    if (!request.user) {
      throw new InternalServerErrorException(
        'Authenticated user was not attached to the request.',
      );
    }

    return this.bookingsService.cancel(request.user, id);
  }
}
