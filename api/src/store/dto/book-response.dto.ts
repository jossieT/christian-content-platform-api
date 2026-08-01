import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BookFormat, ContentStatus } from '@prisma/client';

class CategorySummaryDto {
  @ApiProperty() id!: string;
  @ApiProperty() name!: string;
  @ApiProperty() slug!: string;
}

export class BookResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() title!: string;
  @ApiProperty() slug!: string;
  @ApiProperty() authorName!: string;
  @ApiPropertyOptional() publisher?: string | null;
  @ApiPropertyOptional() isbn?: string | null;
  @ApiProperty() description!: string;
  @ApiPropertyOptional() coverImageUrl?: string | null;
  @ApiProperty() price!: number;
  @ApiProperty() isFree!: boolean;
  @ApiProperty({ enum: BookFormat }) format!: BookFormat;
  @ApiPropertyOptional() fileUrl?: string | null;
  @ApiProperty({ enum: ContentStatus }) status!: ContentStatus;
  @ApiProperty() createdAt!: Date;
  @ApiProperty() updatedAt!: Date;
  @ApiPropertyOptional({ type: CategorySummaryDto }) category?: CategorySummaryDto | null;
}

export class BooksListResponseDto {
  @ApiProperty({ type: [BookResponseDto] }) items!: BookResponseDto[];
  @ApiProperty() total!: number;
  @ApiProperty() skip!: number;
  @ApiProperty() take!: number;
}
