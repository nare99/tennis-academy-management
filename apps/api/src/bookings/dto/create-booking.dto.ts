
import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateBookingDto {
  @ApiProperty({
    description: 'ID of the court to book',
    example: 'cm1234567890court123456',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(64)
  courtId!: string;

  @ApiProperty({
    description: 'Booking start time in ISO 8601 format',
    example: '2026-11-10T10:00:00.000Z',
  })
  @IsDateString({ strict: true, strictSeparator: true })
  startAt!: string;

  @ApiProperty({
    description: 'Booking end time in ISO 8601 format',
    example: '2026-11-10T11:00:00.000Z',
  })
  @IsDateString({ strict: true, strictSeparator: true })
  endAt!: string;
}
