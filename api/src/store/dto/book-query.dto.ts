import { ApiPropertyOptional } from '@nestjs/swagger';
import { BookFormat, ContentStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class BookQueryDto {
  @ApiPropertyOptional({ default: 0 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  skip?: number = 0;

  @ApiPropertyOptional({ default: 20 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  take?: number = 20;

  @ApiPropertyOptional({ description: 'Category slug or ID filter' })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiPropertyOptional({ enum: BookFormat })
  @IsEnum(BookFormat)
  @IsOptional()
  format?: BookFormat;

  @ApiPropertyOptional({ description: 'Filter only free books' })
  @Type(() => Boolean)
  @IsBoolean()
  @IsOptional()
  isFree?: boolean;

  @ApiPropertyOptional({ description: 'Search title, author, or description' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ enum: ContentStatus })
  @IsEnum(ContentStatus)
  @IsOptional()
  status?: ContentStatus;
}
