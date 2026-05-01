import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsISO8601,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { IsFutureDate } from '../../common/validation/is-future-date.decorator';

export class UpdatePromocodeDto {
  @ApiPropertyOptional({ example: 'SALE20' })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiPropertyOptional({ example: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  discountPercent?: number;

  @ApiPropertyOptional({ example: 50, minimum: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  activationLimit?: number;

  @ApiPropertyOptional({
    example: '2099-12-31T23:59:59.000Z',
    format: 'date-time',
  })
  @IsOptional()
  @IsISO8601()
  @IsFutureDate()
  expiresAt?: string;
}
