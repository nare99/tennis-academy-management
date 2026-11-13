import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMaxSize, IsArray, ValidateNested } from 'class-validator';
import { OperatingHourDto } from './operating-hour.dto';

export class ReplaceOperatingHoursDto {
  @ApiProperty({ type: [OperatingHourDto], description: 'Complete weekly schedule. Use an empty array for a closed day.' })
  @IsArray()
  @ArrayMaxSize(70)
  @ValidateNested({ each: true })
  @Type(() => OperatingHourDto)
  intervals!: OperatingHourDto[];
}
