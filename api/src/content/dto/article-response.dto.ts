import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ContentStatus } from '@prisma/client';

class AuthorSummaryDto {
  @ApiProperty() id!: string;
  @ApiProperty() firstName?: string | null;
  @ApiProperty() lastName?: string | null;
  @ApiPropertyOptional() email?: string;
}

class CategorySummaryDto {
  @ApiProperty() id!: string;
  @ApiProperty() name!: string;
  @ApiProperty() slug!: string;
}

class TagSummaryDto {
  @ApiProperty() id!: string;
  @ApiProperty() name!: string;
  @ApiProperty() slug!: string;
}

export class ArticleResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() title!: string;
  @ApiProperty() slug!: string;
  @ApiPropertyOptional() summary?: string | null;
  @ApiProperty() content!: string;
  @ApiPropertyOptional() coverImageUrl?: string | null;
  @ApiProperty({ enum: ContentStatus }) status!: ContentStatus;
  @ApiPropertyOptional() publishedAt?: Date | null;
  @ApiProperty() createdAt!: Date;
  @ApiProperty() updatedAt!: Date;
  @ApiProperty({ type: AuthorSummaryDto }) author!: AuthorSummaryDto;
  @ApiPropertyOptional({ type: CategorySummaryDto }) category?: CategorySummaryDto | null;
  @ApiProperty({ type: [TagSummaryDto] }) tags!: TagSummaryDto[];
}

export class ArticlesListResponseDto {
  @ApiProperty({ type: [ArticleResponseDto] }) items!: ArticleResponseDto[];
  @ApiProperty() total!: number;
  @ApiProperty() skip!: number;
  @ApiProperty() take!: number;
}
