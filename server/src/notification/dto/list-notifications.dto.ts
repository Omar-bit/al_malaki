import { IsEnum, IsIn, IsOptional } from 'class-validator';
import { NotificationType } from '../../generated/prisma';

export class ListNotificationsDto {
  @IsOptional()
  @IsIn(['all', 'read', 'unread'])
  status?: 'all' | 'read' | 'unread';

  @IsOptional()
  @IsEnum(NotificationType)
  type?: NotificationType;
}
