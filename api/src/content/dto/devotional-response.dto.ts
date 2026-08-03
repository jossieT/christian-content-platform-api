import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ContentStatus } from '@prisma/client';

class AuthorSummaryDto {
  @ApiProperty() id!: string;
  @ApiProperty() firstName?: string | null;
  @ApiProperty() lastName?: string | null;
}

class CategorySummaryDto {
  @ApiProperty() id!: string;
  @ApiProperty() name!: string;
  @ApiProperty() slug!: string;
}

export class DevotionalResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() title!: string;
  @ApiProperty() slug!: string;
  @ApiProperty() scriptureReference!: string;
  @ApiPropertyOptional() scriptureText?: string | null;
  @ApiProperty() content!: string;
  @ApiPropertyOptional() prayer?: string | null;
  @ApiProperty() date!: Date;
  @ApiProperty({ enum: ContentStatus }) status!: ContentStatus;
  @ApiProperty() createdAt!: Date;
  @ApiProperty() updatedAt!: Date;
  @ApiProperty({ type: AuthorSummaryDto }) author!: AuthorSummaryDto;
  @ApiPropertyOptional({ type: CategorySummaryDto })
  category?: CategorySummaryDto | null;
}

export class DevotionalsListResponseDto {
  @ApiProperty({ type: [DevotionalResponseDto] })
  items!: DevotionalResponseDto[];
  @ApiProperty() total!: number;
  @ApiProperty() skip!: number;
  @ApiProperty() take!: number;
}
