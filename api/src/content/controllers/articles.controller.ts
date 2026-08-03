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
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import {
  ArticleResponseDto,
  ArticlesListResponseDto,
} from '../dto/article-response.dto';
import { ContentQueryDto } from '../dto/content-query.dto';
import { CreateArticleDto } from '../dto/create-article.dto';
import { UpdateArticleDto } from '../dto/update-article.dto';
import { ArticlesService } from '../services/articles.service';

@ApiTags('Articles')
@Controller('articles')
export class ArticlesController {
  constructor(private readonly articlesService: ArticlesService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'List published Christian articles (Public)' })
  @ApiResponse({
    status: 200,
    type: ArticlesListResponseDto,
    description: 'Published articles returned successfully',
  })
  async findAllPublished(@Query() query: ContentQueryDto) {
    return this.articlesService.findAll(query, true);
  }

  @Get('manage')
  @Roles(Role.ADMIN, Role.CREATOR)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Admin/Creator: List all articles including drafts',
  })
  @ApiResponse({
    status: 200,
    type: ArticlesListResponseDto,
    description: 'Admin/creator articles returned successfully',
  })
  async findAllAdmin(@Query() query: ContentQueryDto) {
    return this.articlesService.findAll(query, false);
  }

  @Public()
  @Get(':slug')
  @ApiOperation({ summary: 'Get published article details by slug' })
  @ApiResponse({
    status: 200,
    type: ArticleResponseDto,
    description: 'Article returned successfully',
  })
  async findBySlug(@Param('slug') slug: string) {
    return this.articlesService.findBySlug(slug);
  }

  @Post()
  @Roles(Role.ADMIN, Role.CREATOR)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create a new article draft or published article' })
  @ApiResponse({
    status: 201,
    type: ArticleResponseDto,
    description: 'Article created successfully',
  })
  async create(
    @CurrentUser('id') authorId: string,
    @Body() dto: CreateArticleDto,
  ) {
    return this.articlesService.create(authorId, dto);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.CREATOR)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update an article' })
  @ApiResponse({
    status: 200,
    type: ArticleResponseDto,
    description: 'Article updated successfully',
  })
  async update(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() dto: UpdateArticleDto,
  ) {
    const isAdmin = user.role === Role.ADMIN;
    return this.articlesService.update(id, user.id, dto, isAdmin);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.CREATOR)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete an article' })
  @ApiResponse({ status: 200, description: 'Article deleted successfully' })
  async delete(@Param('id') id: string, @CurrentUser() user: any) {
    const isAdmin = user.role === Role.ADMIN;
    return this.articlesService.delete(id, user.id, isAdmin);
  }
}
