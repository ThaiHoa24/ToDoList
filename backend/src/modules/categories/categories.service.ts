import { Injectable } from '@nestjs/common';
import { CategoriesRepository } from './categories.repository.js';
import { CreateCategoryDto } from './dto/create-category.dto.js';
import { UpdateCategoryDto } from './dto/update-category.dto.js';

@Injectable()
export class CategoriesService {
  constructor(private readonly categoriesRepository: CategoriesRepository) {}

  async create(createCategoryDto: CreateCategoryDto, userId: string) {
    return this.categoriesRepository.create(createCategoryDto, userId);
  }

  async findAll(userId: string) {
    return this.categoriesRepository.findAll(userId);
  }

  async findOne(id: string, userId: string) {
    return this.categoriesRepository.findById(id, userId);
  }

  async update(id: string, updateCategoryDto: UpdateCategoryDto, userId: string) {
    return this.categoriesRepository.update(id, updateCategoryDto, userId);
  }

  async remove(id: string, userId: string) {
    return this.categoriesRepository.delete(id, userId);
  }
}
