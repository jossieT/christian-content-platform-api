import { Module } from '@nestjs/common';
import { ArticlesController } from './controllers/articles.controller';
import { CategoriesController } from './controllers/categories.controller';
import { DevotionalsController } from './controllers/devotionals.controller';
import { ArticlesService } from './services/articles.service';
import { CategoriesService } from './services/categories.service';
import { DevotionalsService } from './services/devotionals.service';

@Module({
  controllers: [
    CategoriesController,
    ArticlesController,
    DevotionalsController,
  ],
  providers: [CategoriesService, ArticlesService, DevotionalsService],
  exports: [CategoriesService, ArticlesService, DevotionalsService],
})
export class ContentModule {}
