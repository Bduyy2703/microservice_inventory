import { Module } from '@nestjs/common';
import { ChannelServiceController } from './channel-service.controller';
import { ChannelServiceService } from './channel-service.service';

@Module({
  imports: [],
  controllers: [ChannelServiceController],
  providers: [ChannelServiceService],
})
export class ChannelServiceModule {}
