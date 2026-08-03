import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Ip,
  Post,
  Headers,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthResponseDto } from './dto/auth-response.dto';
import {
  RequestOtpDto,
  RequestOtpResponseDto,
  VerifyOtpDto,
} from './dto/phone-auth.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RegisterDto } from './dto/register.dto';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @ApiOperation({
    summary: 'Register a new user account with email and password',
  })
  @ApiResponse({
    status: 201,
    type: AuthResponseDto,
    description: 'User account created successfully',
  })
  async register(
    @Body() dto: RegisterDto,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ): Promise<AuthResponseDto> {
    return this.authService.register(dto, ip, userAgent);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Authenticate user with email and password' })
  @ApiResponse({
    status: 200,
    type: AuthResponseDto,
    description: 'Authenticated successfully',
  })
  async login(
    @Body() dto: LoginDto,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ): Promise<AuthResponseDto> {
    return this.authService.login(dto, ip, userAgent);
  }

  @Public()
  @Post('phone/request-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Request OTP code via SMS for phone number authentication',
    description:
      'Sends a 6-digit OTP to the provided phone number. Rate limited to once every 60 seconds.',
  })
  @ApiResponse({
    status: 200,
    type: RequestOtpResponseDto,
    description: 'OTP sent successfully',
  })
  @ApiResponse({
    status: 429,
    description: 'Too many requests — resend cooldown active',
  })
  async requestOtp(
    @Body() dto: RequestOtpDto,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ): Promise<RequestOtpResponseDto> {
    return this.authService.requestPhoneOtp(dto, ip, userAgent);
  }

  @Public()
  @Post('phone/verify-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verify OTP and authenticate or register user by phone number',
    description:
      'Validates the 6-digit OTP. Creates a new user account if phone number is not registered. Returns JWT token pair on success.',
  })
  @ApiResponse({
    status: 200,
    type: AuthResponseDto,
    description: 'Authenticated successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid, expired, or maximum-attempts-exceeded OTP',
  })
  async verifyOtp(
    @Body() dto: VerifyOtpDto,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ): Promise<AuthResponseDto> {
    return this.authService.verifyPhoneOtp(dto, ip, userAgent);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Refresh JWT Access Token using a valid Refresh Token',
  })
  @ApiResponse({
    status: 200,
    type: AuthResponseDto,
    description: 'New token pair generated',
  })
  async refresh(@Body() dto: RefreshTokenDto): Promise<AuthResponseDto> {
    return this.authService.refreshToken(dto.refreshToken);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Logout and revoke refresh token' })
  async logout(@Body() dto: RefreshTokenDto): Promise<{ message: string }> {
    return this.authService.logout(dto.refreshToken);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Retrieve currently authenticated user information',
  })
  getMe(@CurrentUser() user: Record<string, unknown>): Record<string, unknown> {
    return user;
  }
}
