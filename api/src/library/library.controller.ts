import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { LibraryEntryResponseDto } from './dto/library-response.dto';
import { UpdateReadingProgressDto } from './dto/update-reading-progress.dto';
import { LibraryService } from './library.service';

@ApiTags('User Library & Reader')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('library')
export class LibraryController {
  constructor(private readonly libraryService: LibraryService) {}

  @Get()
  @ApiOperation({ summary: 'Get current user personal library bookshelf' })
  @ApiResponse({
    status: 200,
    type: [LibraryEntryResponseDto],
    description: 'User bookshelf returned successfully',
  })
  async getBookshelf(@CurrentUser('id') userId: string) {
    return this.libraryService.getUserBookshelf(userId);
  }

  @Post('claim/:bookId')
  @ApiOperation({
    summary: 'Claim or purchase a digital book into user library',
  })
  @ApiResponse({
    status: 201,
    type: LibraryEntryResponseDto,
    description: 'Book claimed into the user library successfully',
  })
  async claimBook(
    @CurrentUser('id') userId: string,
    @Param('bookId') bookId: string,
  ) {
    return this.libraryService.claimBook(userId, bookId);
  }

  @Get('progress/:bookId')
  @ApiOperation({
    summary: 'Get current reading progress and position for a book',
  })
  @ApiResponse({
    status: 200,
    description: 'Reading progress returned successfully',
  })
  async getProgress(
    @CurrentUser('id') userId: string,
    @Param('bookId') bookId: string,
  ) {
    return this.libraryService.getReadingProgress(userId, bookId);
  }

  @Patch('progress/:bookId')
  @ApiOperation({ summary: 'Update reading progress location and percentage' })
  @ApiResponse({
    status: 200,
    description: 'Reading progress updated successfully',
  })
  async updateProgress(
    @CurrentUser('id') userId: string,
    @Param('bookId') bookId: string,
    @Body() dto: UpdateReadingProgressDto,
  ) {
    return this.libraryService.updateReadingProgress(userId, bookId, dto);
  }
}
