import { Controller, Post, Body } from '@nestjs/common';
import { RmqOptions } from '@nestjs/microservices';

import {
  ClientProxy,
  ClientProxyFactory,
  Transport,
} from '@nestjs/microservices';

@Controller('inventory')
export class InventoryController {
  private client: ClientProxy;
  constructor() {
    this.client = ClientProxyFactory.create({
      transport: Transport.RMQ,
      options: {
        urls: [process.env.RABBITMQ_URL || 'amqp://localhost:5672'],
        queue: 'inventory_queue',
        queueOptions: { durable: true },
      },
    } as RmqOptions);
  }

  @Post('update')
  updateInventory(@Body() data: { productId: number; quantity: number }) {
    console.log('Inventory updated:', data);
    // Emit event để Channel Service sync
    this.client.emit('inventory.updated', data);
    return { success: true };
  }
}
