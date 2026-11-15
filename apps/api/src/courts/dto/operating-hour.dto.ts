import { ApiProperty } from '@nestjs/swagger';
import { DayOfWeek } from '@prisma/client';
import { IsEnum, IsInt, Max, Min } from 'class-validator';

export class OperatingHourDto {
  @ApiProperty({ enum: DayOfWeek })
  @IsEnum(DayOfWeek)
  dayOfWeek!: DayOfWeek;

  @ApiProperty({ example: 540, minimum: 0, maximum: 1439, description: 'Minutes after midnight.' })
  @IsInt()
  @Min(0)
  @Max(1439)
  startMinute!: number;

  @ApiProperty({ example: 1320, minimum: 1, maximum: 1440, description: 'Minutes after midnight; 1440 means midnight.' })
  @IsInt()
  @Min(1)
  @Max(1440)
  endMinute!: number;
}
