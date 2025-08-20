import { NestFactory } from '@nestjs/core';
import { ChannelServiceModule } from './channel-service.module';

async function bootstrap() {
  const app = await NestFactory.create(ChannelServiceModule);
  await app.listen(process.env.port ?? 3000);
}
bootstrap();
