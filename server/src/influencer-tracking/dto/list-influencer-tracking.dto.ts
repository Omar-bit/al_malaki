import { Transform } from 'class-transformer';
import { IsIn, IsOptional, IsString } from 'class-validator';

const STATUS_VALUES = ['active', 'disabled'] as const;
const SORT_FIELDS = [
  'createdAt',
  'influencerName',
  'clicks',
  'accountsCreated',
  'orders',
  'revenue',
  'conversionRate',
] as const;
const SORT_ORDERS = ['asc', 'desc'] as const;

export class ListInfluencerTrackingDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsOptional()
  @IsString()
  search?: string;

  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsOptional()
  @IsIn(STATUS_VALUES)
  status?: (typeof STATUS_VALUES)[number];

  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsOptional()
  @IsIn(SORT_FIELDS)
  sortBy: (typeof SORT_FIELDS)[number] = 'createdAt';

  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsOptional()
  @IsIn(SORT_ORDERS)
  sortOrder: (typeof SORT_ORDERS)[number] = 'desc';
}
