import { Controller, Get } from '@nestjs/common';
import { ChannelServiceService } from './channel-service.service';

@Controller()
export class ChannelServiceController {
  constructor(private readonly channelServiceService: ChannelServiceService) {}

  @Get()
  getHello(): string {
    return this.channelServiceService.getHello();
  }
}
