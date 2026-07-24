import { IsEnum, IsOptional } from 'class-validator';

export class UpdateInfluencerTrackingDto {
  @IsOptional()
  @IsEnum(['active', 'disabled'])
  status?: 'active' | 'disabled';
}
