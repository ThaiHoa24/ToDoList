import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { CategoriesRepository } from './categories.repository.js';
import { CreateCategoryDto } from './dto/create-category.dto.js';
import { UpdateCategoryDto } from './dto/update-category.dto.js';

@Injectable()
export class CategoriesService {
  constructor(private readonly categoriesRepository: CategoriesRepository) {}

  private parseNumericId(id: number | string, entityName = 'ID'): number {
    const numericId = Number(id);
    if (Number.isNaN(numericId) || !Number.isInteger(numericId) || numericId <= 0) {
      throw new BadRequestException(`${entityName} không hợp lệ`);
    }
    return numericId;
  }

  async create(createCategoryDto: CreateCategoryDto, userId: number | string) {
    const numericUserId = this.parseNumericId(userId, 'User ID');

    // Kiểm tra trùng lặp [user_id, name]
    const existing = await this.categoriesRepository.findByName(
      createCategoryDto.name,
      numericUserId,
    );
    if (existing) {
      throw new ConflictException(`Danh mục '${createCategoryDto.name}' đã tồn tại`);
    }

    try {
      return await this.categoriesRepository.create(createCategoryDto, numericUserId);
    } catch (error: any) {
      if (error?.code === 'P2002') {
        throw new ConflictException(`Danh mục '${createCategoryDto.name}' đã tồn tại`);
      }
      throw error;
    }
  }

  async findAll(userId: number | string) {
    const numericUserId = this.parseNumericId(userId, 'User ID');
    return this.categoriesRepository.findAll(numericUserId);
  }

  async findOne(id: number | string, userId: number | string) {
    const numericId = this.parseNumericId(id, 'Category ID');
    const numericUserId = this.parseNumericId(userId, 'User ID');

    // Tenant Isolation: Kiểm tra thuộc sở hữu của user
    const category = await this.categoriesRepository.findById(numericId, numericUserId);
    if (!category) {
      throw new NotFoundException('Không tìm thấy danh mục hoặc bạn không có quyền truy cập');
    }
    return category;
  }

  async update(
    id: number | string,
    updateCategoryDto: UpdateCategoryDto,
    userId: number | string,
  ) {
    const numericId = this.parseNumericId(id, 'Category ID');
    const numericUserId = this.parseNumericId(userId, 'User ID');

    // Tenant Isolation: Kiểm tra tồn tại và quyền sở hữu trước khi cập nhật
    const existingCategory = await this.categoriesRepository.findById(
      numericId,
      numericUserId,
    );
    if (!existingCategory) {
      throw new NotFoundException('Không tìm thấy danh mục hoặc bạn không có quyền truy cập');
    }

    // Nếu có đổi tên, kiểm tra trùng lặp tên với các danh mục khác của user
    if (updateCategoryDto.name && updateCategoryDto.name !== existingCategory.name) {
      const duplicateName = await this.categoriesRepository.findByName(
        updateCategoryDto.name,
        numericUserId,
      );
      if (duplicateName && duplicateName.id !== numericId) {
        throw new ConflictException(`Danh mục '${updateCategoryDto.name}' đã tồn tại`);
      }
    }

    try {
      return await this.categoriesRepository.update(
        numericId,
        updateCategoryDto,
        numericUserId,
      );
    } catch (error: any) {
      if (error?.code === 'P2002') {
        throw new ConflictException(`Danh mục '${updateCategoryDto.name}' đã tồn tại`);
      }
      throw error;
    }
  }

  async remove(id: number | string, userId: number | string) {
    const numericId = this.parseNumericId(id, 'Category ID');
    const numericUserId = this.parseNumericId(userId, 'User ID');

    // Tenant Isolation: Kiểm tra tồn tại và quyền sở hữu trước khi xóa
    const existingCategory = await this.categoriesRepository.findById(
      numericId,
      numericUserId,
    );
    if (!existingCategory) {
      throw new NotFoundException('Không tìm thấy danh mục hoặc bạn không có quyền truy cập');
    }

    return this.categoriesRepository.delete(numericId, numericUserId);
  }
}
