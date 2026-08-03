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
import { ContentQueryDto } from '../dto/content-query.dto';
import { CreateDevotionalDto } from '../dto/create-devotional.dto';
import {
  DevotionalResponseDto,
  DevotionalsListResponseDto,
} from '../dto/devotional-response.dto';
import { UpdateDevotionalDto } from '../dto/update-devotional.dto';
import { DevotionalsService } from '../services/devotionals.service';

@ApiTags('Daily Word & Devotionals')
@Controller('devotionals')
export class DevotionalsController {
  constructor(private readonly devotionalsService: DevotionalsService) {}

  @Public()
  @Get('today')
  @ApiOperation({ summary: 'Get Today Daily Devotional / Word' })
  @ApiResponse({
    status: 200,
    type: DevotionalResponseDto,
    description: 'Today devotional returned successfully',
  })
  async getToday() {
    return this.devotionalsService.getTodayDevotional();
  }

  @Public()
  @Get('date/:date')
  @ApiOperation({ summary: 'Get devotional by date (Format: YYYY-MM-DD)' })
  @ApiResponse({
    status: 200,
    type: DevotionalResponseDto,
    description: 'Devotional for the requested date returned successfully',
  })
  async findByDate(@Param('date') date: string) {
    return this.devotionalsService.findByDate(date);
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'List published devotionals (Public)' })
  @ApiResponse({
    status: 200,
    type: DevotionalsListResponseDto,
    description: 'Published devotionals returned successfully',
  })
  async findAllPublished(@Query() query: ContentQueryDto) {
    return this.devotionalsService.findAll(query, true);
  }

  @Get('manage')
  @Roles(Role.ADMIN, Role.CREATOR)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Admin/Creator: List all devotionals including drafts',
  })
  @ApiResponse({
    status: 200,
    type: DevotionalsListResponseDto,
    description: 'Admin/creator devotionals returned successfully',
  })
  async findAllAdmin(@Query() query: ContentQueryDto) {
    return this.devotionalsService.findAll(query, false);
  }

  @Post()
  @Roles(Role.ADMIN, Role.CREATOR)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create a new daily devotional' })
  @ApiResponse({
    status: 201,
    type: DevotionalResponseDto,
    description: 'Devotional created successfully',
  })
  async create(
    @CurrentUser('id') authorId: string,
    @Body() dto: CreateDevotionalDto,
  ) {
    return this.devotionalsService.create(authorId, dto);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.CREATOR)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update a devotional' })
  @ApiResponse({
    status: 200,
    type: DevotionalResponseDto,
    description: 'Devotional updated successfully',
  })
  async update(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() dto: UpdateDevotionalDto,
  ) {
    const isAdmin = user.role === Role.ADMIN;
    return this.devotionalsService.update(id, user.id, dto, isAdmin);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.CREATOR)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete a devotional' })
  @ApiResponse({ status: 200, description: 'Devotional deleted successfully' })
  async delete(@Param('id') id: string, @CurrentUser() user: any) {
    const isAdmin = user.role === Role.ADMIN;
    return this.devotionalsService.delete(id, user.id, isAdmin);
  }
}
