export interface ISmsService {
  /**
   * Send SMS message to target phone number
   * @param phoneNumber Destination phone number in E.164 format (e.g. +12345678901)
   * @param message SMS body text
   */
  sendSms(phoneNumber: string, message: string): Promise<boolean>;
}

export const SMS_SERVICE = 'SMS_SERVICE';
