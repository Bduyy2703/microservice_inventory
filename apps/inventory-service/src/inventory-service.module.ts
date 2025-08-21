import { Module } from '@nestjs/common';
import { InventoryController } from './inventory-service.controller';

@Module({
  controllers: [InventoryController],
})
export class InventoryServiceModule {}
