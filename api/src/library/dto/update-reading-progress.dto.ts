import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class UpdateReadingProgressDto {
  @ApiPropertyOptional({ example: 'epubcfi(/6/4[chap01]!/4/2/1:0)' })
  @IsString()
  @IsOptional()
  currentLocation?: string;

  @ApiPropertyOptional({
    example: 45.5,
    description: 'Percentage completion (0 - 100)',
  })
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  completionPercentage?: number;
}
