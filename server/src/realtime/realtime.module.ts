import { Global, Module } from '@nestjs/common';
import { RealtimeBusService } from './realtime-bus.service';

@Global()
@Module({
  providers: [RealtimeBusService],
  exports: [RealtimeBusService],
})
export class RealtimeModule {}
