import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ContentStatus } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateDevotionalDto {
  @ApiProperty({ example: 'Abiding in the Vine' })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiProperty({ example: 'John 15:5' })
  @IsString()
  @IsNotEmpty()
  scriptureReference!: string;

  @ApiPropertyOptional({ example: 'I am the vine; you are the branches...' })
  @IsString()
  @IsOptional()
  scriptureText?: string;

  @ApiProperty({
    example: 'Today we reflect on what it means to stay connected to Christ...',
  })
  @IsString()
  @IsNotEmpty()
  content!: string;

  @ApiPropertyOptional({ example: 'Lord, help us abide in Your love daily...' })
  @IsString()
  @IsOptional()
  prayer?: string;

  @ApiProperty({ example: '2026-08-01', description: 'ISO Date (YYYY-MM-DD)' })
  @IsString()
  @IsNotEmpty()
  date!: string;

  @ApiPropertyOptional({ enum: ContentStatus, default: ContentStatus.DRAFT })
  @IsEnum(ContentStatus)
  @IsOptional()
  status?: ContentStatus;

  @ApiPropertyOptional({ description: 'Category ID' })
  @IsString()
  @IsOptional()
  categoryId?: string;
}
