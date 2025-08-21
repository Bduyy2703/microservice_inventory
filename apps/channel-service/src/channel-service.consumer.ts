import { Injectable } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';

@Injectable()
export class ChannelConsumer {
  @EventPattern('inventory.updated')
  handleInventoryUpdate(@Payload() data: any) {
    console.log('Channel Service received update:', data);
    // TODO: Call Amazon/Wayfair API
  }
}
