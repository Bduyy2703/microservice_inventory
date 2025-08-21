import { Injectable } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';

@Injectable()
export class ReportingConsumer {
  @EventPattern('inventory.updated')
  handleSyncLog(@Payload() data: any) {
    console.log('Reporting Service log sync:', data);
    // TODO: insert into report_db.sync_logs
  }
}
