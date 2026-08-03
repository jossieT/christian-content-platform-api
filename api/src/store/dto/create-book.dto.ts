import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BookFormat, ContentStatus } from '@prisma/client';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateBookDto {
  @ApiProperty({ example: 'The Pursuit of God' })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiProperty({ example: 'A.W. Tozer' })
  @IsString()
  @IsNotEmpty()
  authorName!: string;

  @ApiPropertyOptional({ example: 'Christian Publications' })
  @IsString()
  @IsOptional()
  publisher?: string;

  @ApiPropertyOptional({ example: '978-1600660153' })
  @IsString()
  @IsOptional()
  isbn?: string;

  @ApiProperty({ example: 'A classic work of Christian devotion...' })
  @IsString()
  @IsNotEmpty()
  description!: string;

  @ApiPropertyOptional({ example: 'https://example.com/tozer-cover.jpg' })
  @IsString()
  @IsOptional()
  coverImageUrl?: string;

  @ApiPropertyOptional({ example: 9.99, default: 0.0 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  price?: number;

  @ApiPropertyOptional({ default: false })
  @IsBoolean()
  @IsOptional()
  isFree?: boolean;

  @ApiPropertyOptional({ enum: BookFormat, default: BookFormat.EPUB })
  @IsEnum(BookFormat)
  @IsOptional()
  format?: BookFormat;

  @ApiPropertyOptional({
    example: 'https://storage.christianplatform.org/books/tozer.epub',
  })
  @IsString()
  @IsOptional()
  fileUrl?: string;

  @ApiPropertyOptional({ enum: ContentStatus, default: ContentStatus.DRAFT })
  @IsEnum(ContentStatus)
  @IsOptional()
  status?: ContentStatus;

  @ApiPropertyOptional({ description: 'Category ID' })
  @IsString()
  @IsOptional()
  categoryId?: string;
}
