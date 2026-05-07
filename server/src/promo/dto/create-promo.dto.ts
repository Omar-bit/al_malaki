import {
  IsBoolean,
  IsDateString,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreatePromoDto {
  @IsString()
  @IsNotEmpty()
  code: string;

  @IsString()
  @IsIn(['percentage', 'fixed'])
  discountType: 'percentage' | 'fixed';

  @IsNumber()
  @Min(0)
  value: number;

  @IsInt()
  @Min(1)
  @IsOptional()
  usageLimit?: number;

  @IsString()
  @IsOptional()
  productId?: string;

  @IsDateString()
  startDate: string;

  @IsDateString()
  @IsOptional()
  expiration?: string;

  @IsBoolean()
  isLifetime: boolean;

  @IsString()
  @IsOptional()
  source?: string;
}
