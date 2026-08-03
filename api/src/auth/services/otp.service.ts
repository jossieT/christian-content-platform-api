import {
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import type { ISmsService } from '../interfaces/sms-service.interface';
import { SMS_SERVICE } from '../interfaces/sms-service.interface';

@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    @Inject(SMS_SERVICE) private smsService: ISmsService,
  ) {}

  /**
   * Generates a cryptographically secure 6-digit OTP, stores its bcrypt hash, and dispatches SMS.
   */
  async generateAndSendOtp(
    phoneNumber: string,
  ): Promise<{ cooldownSeconds: number; expiresAt: Date }> {
    const cooldownSeconds = this.configService.get<number>(
      'OTP_RESEND_COOLDOWN_SECONDS',
      60,
    );
    const expirationSeconds = this.configService.get<number>(
      'OTP_EXPIRATION_SECONDS',
      300,
    );
    const maxAttempts = this.configService.get<number>('OTP_MAX_ATTEMPTS', 3);

    // 1. Rate Limiting Check: Ensure resend request is not made faster than cooldown
    const latestOtp = await this.prisma.otpVerification.findFirst({
      where: { phoneNumber },
      orderBy: { createdAt: 'desc' },
    });

    if (latestOtp) {
      const secondsSinceLastOtp = Math.floor(
        (Date.now() - latestOtp.createdAt.getTime()) / 1000,
      );
      if (secondsSinceLastOtp < cooldownSeconds) {
        const remainingCooldown = cooldownSeconds - secondsSinceLastOtp;
        throw new HttpException(
          `Please wait ${remainingCooldown} seconds before requesting a new OTP.`,
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
    }

    // 2. Invalidate previous unused active OTPs for this phone number
    await this.prisma.otpVerification.updateMany({
      where: { phoneNumber, isUsed: false },
      data: { isUsed: true },
    });

    // 3. Generate Cryptographically Secure 6-Digit OTP
    const rawOtp = crypto.randomInt(100000, 999999).toString();

    // 4. Securely hash OTP before storing
    const otpHash = await bcrypt.hash(rawOtp, 10);
    const expiresAt = new Date(Date.now() + expirationSeconds * 1000);

    // 5. Store in Database
    await this.prisma.otpVerification.create({
      data: {
        phoneNumber,
        otpHash,
        maxAttempts,
        expiresAt,
      },
    });

    // 6. Send SMS via Abstract SMS Provider
    const message = `Your verification code is: ${rawOtp}. Valid for 5 minutes. Do not share it with anyone.`;
    await this.smsService.sendSms(phoneNumber, message);

    return {
      cooldownSeconds,
      expiresAt,
    };
  }

  /**
   * Validates an OTP code against stored hash, checks expiration, single-use, and attempt limits.
   */
  async verifyOtp(phoneNumber: string, inputOtp: string): Promise<boolean> {
    const activeOtp = await this.prisma.otpVerification.findFirst({
      where: {
        phoneNumber,
        isUsed: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!activeOtp) {
      throw new UnauthorizedException('Invalid or expired OTP code');
    }

    // Check if maximum verification attempts exceeded
    if (activeOtp.attempts >= activeOtp.maxAttempts) {
      // Invalidate OTP due to brute-force protection
      await this.prisma.otpVerification.update({
        where: { id: activeOtp.id },
        data: { isUsed: true },
      });
      throw new UnauthorizedException(
        'Maximum verification attempts exceeded. Please request a new OTP.',
      );
    }

    // Verify OTP Hash using bcrypt
    const isValid = await bcrypt.compare(inputOtp, activeOtp.otpHash);

    if (!isValid) {
      // Increment attempt counter
      await this.prisma.otpVerification.update({
        where: { id: activeOtp.id },
        data: { attempts: activeOtp.attempts + 1 },
      });

      const remainingAttempts =
        activeOtp.maxAttempts - (activeOtp.attempts + 1);
      if (remainingAttempts <= 0) {
        // Mark used on final failed attempt
        await this.prisma.otpVerification.update({
          where: { id: activeOtp.id },
          data: { isUsed: true },
        });
        throw new UnauthorizedException(
          'Maximum verification attempts exceeded. Please request a new OTP.',
        );
      }

      throw new UnauthorizedException(
        `Invalid OTP code. ${remainingAttempts} attempt(s) remaining.`,
      );
    }

    // Single-use Invalidation: Mark OTP as used upon success
    await this.prisma.otpVerification.update({
      where: { id: activeOtp.id },
      data: { isUsed: true },
    });

    return true;
  }
}
