import {
  IsBoolean,
  IsDateString,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class UpdatePromoDto {
  @IsString()
  @IsOptional()
  code?: string;

  @IsString()
  @IsIn(['percentage', 'fixed'])
  @IsOptional()
  discountType?: 'percentage' | 'fixed';

  @IsNumber()
  @Min(0)
  @IsOptional()
  value?: number;

  @IsInt()
  @Min(1)
  @IsOptional()
  usageLimit?: number;

  @IsString()
  @IsOptional()
  productId?: string;

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  expiration?: string;

  @IsBoolean()
  @IsOptional()
  isLifetime?: boolean;

  @IsString()
  @IsOptional()
  source?: string;

  @IsString()
  @IsIn(['active', 'expired', 'disabled'])
  @IsOptional()
  status?: 'active' | 'expired' | 'disabled';
}
