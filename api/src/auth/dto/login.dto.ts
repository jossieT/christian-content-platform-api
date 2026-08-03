import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    example: 'user@christianplatform.org',
    description: 'Registered email address',
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty()
  email!: string;

  @ApiProperty({ example: 'P@ssword123!', description: 'User password' })
  @IsString()
  @IsNotEmpty()
  password!: string;
}
