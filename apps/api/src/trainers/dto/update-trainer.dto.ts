import {
  IsEmail, IsInt, IsOptional, IsString, Matches, Max, MaxLength, Min, MinLength,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateTrainerDto {
  @ApiPropertyOptional({ example: 'alex.trainer@example.com', maxLength: 254 })
  @IsOptional()
  @IsEmail()
  @MaxLength(254)
  email?: string;

  @ApiPropertyOptional({ example: 'Alex Morgan', minLength: 2, maxLength: 100 })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name?: string;

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

  @ApiPropertyOptional({ example: 'AMD' })
  @IsOptional()
  @IsString()
  @Matches(/^[A-Z]{3}$/)
  currency?: string;
}
