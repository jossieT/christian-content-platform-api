import { ApiProperty } from '@nestjs/swagger';
import { Role } from '@prisma/client';

export class UserPayloadDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  email!: string;

  @ApiProperty({ required: false })
  firstName?: string | null;

  @ApiProperty({ required: false })
  lastName?: string | null;

  @ApiProperty({ enum: Role })
  role!: Role;
}

export class AuthResponseDto {
  @ApiProperty({ description: 'JWT Access Token' })
  accessToken!: string;

  @ApiProperty({ description: 'JWT Refresh Token' })
  refreshToken!: string;

  @ApiProperty({ type: UserPayloadDto })
  user!: UserPayloadDto;
}
