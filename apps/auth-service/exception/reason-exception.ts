import { HttpException, HttpStatus } from '@nestjs/common';

export class TooManyRequestsException extends HttpException {
  constructor(message?: string) {
    super(message || 'Too Many Requests', HttpStatus.TOO_MANY_REQUESTS);
  }
}
export class ReasonException extends HttpException {
  constructor(reason: string) {
    super({ message: 'Bad Request', reason }, HttpStatus.BAD_REQUEST);
  }
}