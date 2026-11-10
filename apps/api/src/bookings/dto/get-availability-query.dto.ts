import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches } from 'class-validator';

export class GetAvailabilityQueryDto {
  @ApiProperty({
    description: 'The requested date in the academy timezone.',
    example: '2026-11-10',
  })
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'Date must use YYYY-MM-DD format.',
  })
  date!: string;
}
