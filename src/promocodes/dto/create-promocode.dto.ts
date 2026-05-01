import { ApiProperty } from '@nestjs/swagger';
import { IsISO8601, IsInt, IsString, Max, Min } from 'class-validator';
import { IsFutureDate } from '../../common/validation/is-future-date.decorator';

export class CreatePromocodeDto {
  @ApiProperty({ example: 'SALE10' })
  @IsString()
  code!: string;

  @ApiProperty({ example: 10, minimum: 1, maximum: 100 })
  @IsInt()
  @Min(1)
  @Max(100)
  discountPercent!: number;

  @ApiProperty({ example: 100, minimum: 1 })
  @IsInt()
  @Min(1)
  activationLimit!: number;

  @ApiProperty({
    example: '2099-12-31T23:59:59.000Z',
    format: 'date-time',
  })
  @IsISO8601()
  @IsFutureDate()
  expiresAt!: string;
}
