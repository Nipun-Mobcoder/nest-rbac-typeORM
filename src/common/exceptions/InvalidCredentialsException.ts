import { HttpException, HttpStatus } from '@nestjs/common';

export class InvalidCredentialsException extends HttpException {
  constructor() {
    super('Invalid email or password.', HttpStatus.UNAUTHORIZED);
  }
}
