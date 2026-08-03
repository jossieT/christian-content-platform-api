import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { AuthResponseDto } from './dto/auth-response.dto';
import { LoginDto } from './dto/login.dto';
import {
  RequestOtpDto,
  RequestOtpResponseDto,
  VerifyOtpDto,
} from './dto/phone-auth.dto';
import { RegisterDto } from './dto/register.dto';
import { AuditLogService } from './services/audit-log.service';
import { OtpService } from './services/otp.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private otpService: OtpService,
    private auditLogService: AuditLogService,
  ) {}

  async register(
    dto: RegisterDto,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<AuthResponseDto> {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (existingUser) {
      await this.auditLogService.log({
        event: 'REGISTER_FAILED_DUPLICATE_EMAIL',
        provider: 'EMAIL_PASSWORD',
        identifier: dto.email.toLowerCase(),
        ipAddress,
        userAgent,
      });
      throw new ConflictException(
        'An account with this email address already exists',
      );
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        profile: {
          create: {},
        },
      },
    });

    await this.auditLogService.log({
      userId: user.id,
      event: 'USER_REGISTERED',
      provider: 'EMAIL_PASSWORD',
      identifier: user.email!,
      ipAddress,
      userAgent,
    });

    const tokens = await this.generateTokens(
      user.id,
      user.role,
      user.email,
      user.phoneNumber,
    );

    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        phoneNumber: user.phoneNumber,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    };
  }

  async login(
    dto: LoginDto,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<AuthResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (!user || !user.isActive || !user.passwordHash) {
      await this.auditLogService.log({
        event: 'LOGIN_FAILED_INVALID_CREDENTIALS',
        provider: 'EMAIL_PASSWORD',
        identifier: dto.email.toLowerCase(),
        ipAddress,
        userAgent,
      });
      throw new UnauthorizedException('Invalid email or password credentials');
    }

    const isPasswordValid = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      await this.auditLogService.log({
        userId: user.id,
        event: 'LOGIN_FAILED_INVALID_PASSWORD',
        provider: 'EMAIL_PASSWORD',
        identifier: dto.email.toLowerCase(),
        ipAddress,
        userAgent,
      });
      throw new UnauthorizedException('Invalid email or password credentials');
    }

    await this.auditLogService.log({
      userId: user.id,
      event: 'LOGIN_SUCCESS',
      provider: 'EMAIL_PASSWORD',
      identifier: user.email!,
      ipAddress,
      userAgent,
    });

    const tokens = await this.generateTokens(
      user.id,
      user.role,
      user.email,
      user.phoneNumber,
    );

    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        phoneNumber: user.phoneNumber,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    };
  }

  /**
   * Phone + OTP Authentication: Step 1 - Request OTP via SMS
   */
  async requestPhoneOtp(
    dto: RequestOtpDto,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<RequestOtpResponseDto> {
    const { cooldownSeconds, expiresAt } =
      await this.otpService.generateAndSendOtp(dto.phoneNumber);

    await this.auditLogService.log({
      event: 'OTP_REQUESTED',
      provider: 'PHONE_OTP',
      identifier: dto.phoneNumber,
      ipAddress,
      userAgent,
      metadata: { cooldownSeconds, expiresAt },
    });

    return {
      message: 'OTP verification code sent via SMS.',
      cooldownSeconds,
      expiresAt,
    };
  }

  /**
   * Phone + OTP Authentication: Step 2 - Verify OTP & Authenticate/Register User
   */
  async verifyPhoneOtp(
    dto: VerifyOtpDto,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<AuthResponseDto> {
    try {
      await this.otpService.verifyOtp(dto.phoneNumber, dto.otp);
    } catch (error) {
      await this.auditLogService.log({
        event: 'OTP_VERIFICATION_FAILED',
        provider: 'PHONE_OTP',
        identifier: dto.phoneNumber,
        ipAddress,
        userAgent,
        metadata: { error: (error as Error).message },
      });
      throw error;
    }

    // Find existing user by phone number or create new user
    let user = await this.prisma.user.findUnique({
      where: { phoneNumber: dto.phoneNumber },
    });

    if (user) {
      if (!user.isActive) {
        await this.auditLogService.log({
          userId: user.id,
          event: 'LOGIN_FAILED_INACTIVE_USER',
          provider: 'PHONE_OTP',
          identifier: dto.phoneNumber,
          ipAddress,
          userAgent,
        });
        throw new UnauthorizedException('User account is inactive');
      }

      // Update phone verification status if not marked verified yet
      if (!user.isPhoneVerified) {
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: { isPhoneVerified: true },
        });
      }

      await this.auditLogService.log({
        userId: user.id,
        event: 'LOGIN_SUCCESS',
        provider: 'PHONE_OTP',
        identifier: dto.phoneNumber,
        ipAddress,
        userAgent,
      });
    } else {
      // Auto-register new phone user
      user = await this.prisma.user.create({
        data: {
          phoneNumber: dto.phoneNumber,
          isPhoneVerified: true,
          role: Role.USER,
          profile: {
            create: {},
          },
        },
      });

      await this.auditLogService.log({
        userId: user.id,
        event: 'USER_REGISTERED',
        provider: 'PHONE_OTP',
        identifier: dto.phoneNumber,
        ipAddress,
        userAgent,
      });
    }

    const tokens = await this.generateTokens(
      user.id,
      user.role,
      user.email,
      user.phoneNumber,
    );

    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        phoneNumber: user.phoneNumber,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    };
  }

  async refreshToken(refreshTokenStr: string): Promise<AuthResponseDto> {
    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { token: refreshTokenStr },
      include: { user: true },
    });

    if (
      !storedToken ||
      storedToken.isRevoked ||
      storedToken.expiresAt < new Date()
    ) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    if (!storedToken.user.isActive) {
      throw new UnauthorizedException('User account is inactive');
    }

    // Revoke old refresh token (Token Rotation Security Pattern)
    await this.prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { isRevoked: true },
    });

    const tokens = await this.generateTokens(
      storedToken.user.id,
      storedToken.user.role,
      storedToken.user.email,
      storedToken.user.phoneNumber,
    );

    return {
      ...tokens,
      user: {
        id: storedToken.user.id,
        email: storedToken.user.email,
        phoneNumber: storedToken.user.phoneNumber,
        firstName: storedToken.user.firstName,
        lastName: storedToken.user.lastName,
        role: storedToken.user.role,
      },
    };
  }

  async logout(refreshTokenStr: string): Promise<{ message: string }> {
    await this.prisma.refreshToken.updateMany({
      where: { token: refreshTokenStr },
      data: { isRevoked: true },
    });

    return { message: 'Successfully logged out' };
  }

  private async generateTokens(
    userId: string,
    role: Role,
    email?: string | null,
    phoneNumber?: string | null,
  ) {
    const payload = {
      sub: userId,
      role,
      email: email ?? undefined,
      phoneNumber: phoneNumber ?? undefined,
    };

    const accessTokenSecret = this.configService.get<string>(
      'JWT_SECRET',
      'dev-jwt-access-secret-key-change-in-production-32-chars',
    );
    const accessTokenExpiration = this.configService.get<string>(
      'JWT_EXPIRATION',
      '15m',
    );

    const refreshTokenSecret = this.configService.get<string>(
      'JWT_REFRESH_SECRET',
      'dev-jwt-refresh-secret-key-change-in-production-32-chars',
    );
    const refreshTokenExpiration = this.configService.get<string>(
      'JWT_REFRESH_EXPIRATION',
      '7d',
    );

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const accessToken = await this.jwtService.signAsync(payload, {
      secret: accessTokenSecret,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      expiresIn: accessTokenExpiration as any,
    });

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: refreshTokenSecret,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      expiresIn: refreshTokenExpiration as any,
    });

    // Save Refresh Token in Database (7 days expiry)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId,
        expiresAt,
      },
    });

    return {
      accessToken,
      refreshToken,
    };
  }
}
