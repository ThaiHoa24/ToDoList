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
    @CurrentUser('id') userId: string,
    @Body() createCategoryDto: CreateCategoryDto,
  ) {
    const currentId = userId || 'mock-user-id';
    return this.categoriesService.create(createCategoryDto, currentId);
  }

  @Get()
  findAll(@CurrentUser('id') userId: string) {
    const currentId = userId || 'mock-user-id';
    return this.categoriesService.findAll(currentId);
  }

  @Get(':id')
  findOne(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    const currentId = userId || 'mock-user-id';
    return this.categoriesService.findOne(id, currentId);
  }

  @Patch(':id')
  update(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ) {
    const currentId = userId || 'mock-user-id';
    return this.categoriesService.update(id, updateCategoryDto, currentId);
  }

  @Delete(':id')
  remove(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    const currentId = userId || 'mock-user-id';
    return this.categoriesService.remove(id, currentId);
  }
}
