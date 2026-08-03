import { Injectable, Logger } from '@nestjs/common';
import { ISmsService } from '../interfaces/sms-service.interface';

@Injectable()
export class MockSmsService implements ISmsService {
  private readonly logger = new Logger(MockSmsService.name);

  sendSms(phoneNumber: string, message: string): Promise<boolean> {
    this.logger.log(
      `📱 [MOCK SMS DELIVERED] Destination: ${phoneNumber} | Payload: "${message}"`,
    );
    return Promise.resolve(true);
  }
}
