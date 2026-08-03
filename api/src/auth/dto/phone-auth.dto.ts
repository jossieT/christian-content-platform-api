import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Length, Matches } from 'class-validator';

export class RequestOtpDto {
  @ApiProperty({
    example: '+12025550143',
    description:
      'User phone number in E.164 international format (+CountryCodeNumber)',
  })
  @IsNotEmpty()
  @IsString()
  @Matches(/^\+[1-9]\d{1,14}$/, {
    message:
      'Phone number must be a valid E.164 international format (e.g. +12025550143)',
  })
  phoneNumber!: string;
}

export class VerifyOtpDto {
  @ApiProperty({
    example: '+12025550143',
    description: 'User phone number in E.164 international format',
  })
  @IsNotEmpty()
  @IsString()
  @Matches(/^\+[1-9]\d{1,14}$/, {
    message:
      'Phone number must be a valid E.164 international format (e.g. +12025550143)',
  })
  phoneNumber!: string;

  @ApiProperty({
    example: '123456',
    description: '6-digit numeric verification code',
  })
  @IsNotEmpty()
  @IsString()
  @Length(6, 6, { message: 'OTP must be exactly 6 digits' })
  otp!: string;
}

export class RequestOtpResponseDto {
  @ApiProperty({ example: 'OTP verification code sent via SMS.' })
  message!: string;

  @ApiProperty({
    example: 60,
    description: 'Seconds to wait before resending OTP',
  })
  cooldownSeconds!: number;

  @ApiProperty({ example: '2026-08-02T21:15:00.000Z' })
  expiresAt!: Date;
}
