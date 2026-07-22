import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { InfluencerTrackingController } from './influencer-tracking.controller';
import { InfluencerTrackingService } from './influencer-tracking.service';

@Module({
  imports: [AuthModule],
  controllers: [InfluencerTrackingController],
  providers: [InfluencerTrackingService],
  exports: [InfluencerTrackingService],
})
export class InfluencerTrackingModule {}
