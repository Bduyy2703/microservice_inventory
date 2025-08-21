import { Controller, Post, Body } from '@nestjs/common';

@Controller('inventory')
export class InventoryController {
  @Post('update')
  updateInventory(@Body() data: { productId: number; quantity: number }) {
    console.log('Inventory updated (stub):', data);
    // TODO: Thực tế sẽ emit event `inventory.updated` lên RabbitMQ
    return { success: true, message: 'Stub inventory update logged' };
  }
}
