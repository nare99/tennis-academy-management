import {
  IsEmail, IsInt, IsOptional, IsString, Matches, Max, MaxLength, Min, MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTrainerDto {
  @ApiProperty({ example: 'alex.trainer@example.com', maxLength: 254 })
  @IsEmail()
  @MaxLength(254)
  email!: string;

  @ApiProperty({ example: 'Alex Morgan', minLength: 2, maxLength: 100 })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name!: string;

  @ApiPropertyOptional({ example: 'Certified tennis coach.' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  bio?: string | null;

  @ApiPropertyOptional({ example: 500000, minimum: 0, description: 'Minor currency units.' })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(2_000_000_000)
  hourlyRateMinor?: number | null;

  @ApiPropertyOptional({ example: 'AMD', default: 'AMD' })
  @IsOptional()
  @IsString()
  @Matches(/^[A-Z]{3}$/)
  currency?: string;
}
