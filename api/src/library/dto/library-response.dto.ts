import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class BookSummaryDto {
  @ApiProperty() id!: string;
  @ApiProperty() title!: string;
  @ApiProperty() slug!: string;
  @ApiProperty() authorName!: string;
  @ApiPropertyOptional() coverImageUrl?: string | null;
  @ApiPropertyOptional() format?: string | null;
  @ApiPropertyOptional() fileUrl?: string | null;
}

export class LibraryEntryResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() userId!: string;
  @ApiProperty() bookId!: string;
  @ApiProperty() purchasedAt!: Date;
  @ApiProperty() pricePaid!: number;
  @ApiProperty({ type: BookSummaryDto }) book!: BookSummaryDto;
  @ApiProperty() progress!: {
    completionPercentage: number;
    currentLocation: string | null;
    lastReadAt: Date;
  };
}
