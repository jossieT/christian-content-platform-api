import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { BooksService } from './books.service';
import { BookQueryDto } from './dto/book-query.dto';
import { BookResponseDto, BooksListResponseDto } from './dto/book-response.dto';
import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';

@ApiTags('Digital Bookstore')
@Controller('books')
export class BooksController {
  constructor(private readonly booksService: BooksService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Browse published digital bookstore catalog' })
  @ApiResponse({
    status: 200,
    type: BooksListResponseDto,
    description: 'Published books returned successfully',
  })
  async findAllPublished(@Query() query: BookQueryDto) {
    return this.booksService.findAll(query, true);
  }

  @Get('manage')
  @Roles(Role.ADMIN, Role.CREATOR)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Admin/Creator: List all catalog books including drafts',
  })
  @ApiResponse({
    status: 200,
    type: BooksListResponseDto,
    description: 'Admin/creator books returned successfully',
  })
  async findAllAdmin(@Query() query: BookQueryDto) {
    return this.booksService.findAll(query, false);
  }

  @Public()
  @Get(':slug')
  @ApiOperation({ summary: 'Get published book details by slug' })
  @ApiResponse({
    status: 200,
    type: BookResponseDto,
    description: 'Book returned successfully',
  })
  async findBySlug(@Param('slug') slug: string) {
    return this.booksService.findBySlug(slug);
  }

  @Post()
  @Roles(Role.ADMIN, Role.CREATOR)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Add a new book to the bookstore catalog' })
  @ApiResponse({
    status: 201,
    type: BookResponseDto,
    description: 'Book created successfully',
  })
  async create(@Body() dto: CreateBookDto) {
    return this.booksService.create(dto);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.CREATOR)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update a catalog book' })
  @ApiResponse({
    status: 200,
    type: BookResponseDto,
    description: 'Book updated successfully',
  })
  async update(@Param('id') id: string, @Body() dto: UpdateBookDto) {
    return this.booksService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete a book from catalog (Admin only)' })
  @ApiResponse({ status: 200, description: 'Book deleted successfully' })
  async delete(@Param('id') id: string) {
    return this.booksService.delete(id);
  }
}
