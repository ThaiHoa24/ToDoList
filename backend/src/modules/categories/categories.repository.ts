import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';
import { CreateCategoryDto } from './dto/create-category.dto.js';
import { UpdateCategoryDto } from './dto/update-category.dto.js';

@Injectable()
export class CategoriesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(createCategoryDto: CreateCategoryDto, userId: number) {
    return this.prisma.categories.create({
      data: {
        name: createCategoryDto.name,
        color: createCategoryDto.color ?? null,
        icon: createCategoryDto.icon ?? null,
        user_id: userId,
      },
    });
  }

  async findAll(userId: number) {
    return this.prisma.categories.findMany({
      where: {
        user_id: userId,
      },
      orderBy: {
        created_at: 'asc',
      },  
    });
  }

  async findById(id: number, userId: number) {
    return this.prisma.categories.findFirst({
      where: {
        id,
        user_id: userId,
      },
    });
  }

  async findByName(name: string, userId: number) {
    return this.prisma.categories.findFirst({
      where: {
        name,
        user_id: userId,
      },
    });
  }

  async update(id: number, updateCategoryDto: UpdateCategoryDto, _userId: number) {
    const data: {
      name?: string;
      color?: string | null;
      icon?: string | null;
      updated_at: Date;
    } = {
      updated_at: new Date(),
    };

    if (updateCategoryDto.name !== undefined) {
      data.name = updateCategoryDto.name;
    }
    if (updateCategoryDto.color !== undefined) {
      data.color = updateCategoryDto.color;
    }
    if (updateCategoryDto.icon !== undefined) {
      data.icon = updateCategoryDto.icon;
    }

    return this.prisma.categories.update({
      where: {
        id,
      },
      data,
    });
  }

  async delete(id: number, _userId: number) {
    return this.prisma.categories.delete({
      where: {
        id,
      },
    });
  }
}
