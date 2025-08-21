import { Module } from '@nestjs/common';
import { ReportingServiceController } from './reporting-service.controller';
import { ReportingServiceService } from './reporting-service.service';
import { ReportingConsumer } from './reporting-service.consumer';

@Module({
  imports: [],
  controllers: [ReportingServiceController],
  providers: [ReportingServiceService, ReportingConsumer],
})
export class ReportingServiceModule {}
