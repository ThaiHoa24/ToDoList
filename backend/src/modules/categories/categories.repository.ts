import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';
import { CreateCategoryDto } from './dto/create-category.dto.js';
import { UpdateCategoryDto } from './dto/update-category.dto.js';

@Injectable()
export class CategoriesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(createCategoryDto: CreateCategoryDto, userId: string) {
    // TODO: Create category in database via Prisma
    return { id: 'mock-category-id', ...createCategoryDto, userId };
  }

  async findAll(_userId: string) {
    // TODO: Get all categories of user from database
    return [];
  }

  async findById(id: string, userId: string) {
    // TODO: Get category by id and userId from database
    return { id, userId };
  }

  async update(id: string, updateCategoryDto: UpdateCategoryDto, userId: string) {
    // TODO: Update category in database
    return { id, ...updateCategoryDto, userId };
  }

  async delete(id: string, userId: string) {
    // TODO: Delete category in database
    return { id, userId, deleted: true };
  }
}
