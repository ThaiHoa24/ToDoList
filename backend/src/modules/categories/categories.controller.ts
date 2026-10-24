import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { CategoriesService } from './categories.service.js';
import { CreateCategoryDto } from './dto/create-category.dto.js';
import { UpdateCategoryDto } from './dto/update-category.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';

@Controller('categories')
@UseGuards(JwtAuthGuard)
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  create(
    @CurrentUser('id') userId: number | string,
    @Body() createCategoryDto: CreateCategoryDto,
  ) {
    return this.categoriesService.create(createCategoryDto, userId);
  }

  @Get()
  findAll(@CurrentUser('id') userId: number | string) {
    return this.categoriesService.findAll(userId);
  }

  @Get(':id')
  findOne(
    @CurrentUser('id') userId: number | string,
    @Param('id') id: string,
  ) {
    return this.categoriesService.findOne(id, userId);
  }

  @Patch(':id')
  update(
    @CurrentUser('id') userId: number | string,
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ) {
    return this.categoriesService.update(id, updateCategoryDto, userId);
  }

  @Delete(':id')
  remove(
    @CurrentUser('id') userId: number | string,
    @Param('id') id: string,
  ) {
    return this.categoriesService.remove(id, userId);
  }
}
