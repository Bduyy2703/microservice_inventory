import { Injectable } from '@nestjs/common';

@Injectable()
export class ChannelServiceService {
  getHello(): string {
    return 'Hello World!';
  }
}
