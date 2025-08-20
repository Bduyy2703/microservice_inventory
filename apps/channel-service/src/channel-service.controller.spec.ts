import { Test, TestingModule } from '@nestjs/testing';
import { ChannelServiceController } from './channel-service.controller';
import { ChannelServiceService } from './channel-service.service';

describe('ChannelServiceController', () => {
  let channelServiceController: ChannelServiceController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [ChannelServiceController],
      providers: [ChannelServiceService],
    }).compile();

    channelServiceController = app.get<ChannelServiceController>(ChannelServiceController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(channelServiceController.getHello()).toBe('Hello World!');
    });
  });
});
