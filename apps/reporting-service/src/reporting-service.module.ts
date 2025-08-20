import { Module } from '@nestjs/common';
import { ReportingServiceController } from './reporting-service.controller';
import { ReportingServiceService } from './reporting-service.service';

@Module({
  imports: [],
  controllers: [ReportingServiceController],
  providers: [ReportingServiceService],
})
export class ReportingServiceModule {}
