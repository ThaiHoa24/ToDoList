import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { CategoriesService } from './categories.service.js';
import { CreateCategoryDto } from './dto/create-category.dto.js';
import { UpdateCategoryDto } from './dto/update-category.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';

@ApiTags('Categories')
@ApiBearerAuth('JWT-auth')
@Controller('categories')
@UseGuards(JwtAuthGuard)
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  @ApiOperation({ summary: 'Tạo danh mục mới cho người dùng hiện tại' })
  @ApiResponse({ status: 201, description: 'Tạo danh mục thành công' })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ' })
  @ApiResponse({ status: 401, description: 'Chưa xác thực Bearer token' })
  @ApiResponse({ status: 409, description: 'Tên danh mục đã tồn tại trong tài khoản' })
  create(
    @CurrentUser('id') userId: number | string,
    @Body() createCategoryDto: CreateCategoryDto,
  ) {
    return this.categoriesService.create(createCategoryDto, userId);
  }

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách tất cả danh mục của người dùng hiện tại' })
  @ApiResponse({ status: 200, description: 'Danh sách danh mục' })
  @ApiResponse({ status: 401, description: 'Chưa xác thực Bearer token' })
  findAll(@CurrentUser('id') userId: number | string) {
    return this.categoriesService.findAll(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy thông tin chi tiết một danh mục theo ID' })
  @ApiParam({ name: 'id', type: Number, description: 'ID danh mục' })
  @ApiResponse({ status: 200, description: 'Chi tiết danh mục' })
  @ApiResponse({ status: 401, description: 'Chưa xác thực' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy danh mục hoặc không có quyền truy cập' })
  findOne(
    @CurrentUser('id') userId: number | string,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.categoriesService.findOne(id, userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Cập nhật thông tin danh mục theo ID' })
  @ApiParam({ name: 'id', type: Number, description: 'ID danh mục' })
  @ApiResponse({ status: 200, description: 'Cập nhật danh mục thành công' })
  @ApiResponse({ status: 401, description: 'Chưa xác thực' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy danh mục hoặc không có quyền truy cập' })
  @ApiResponse({ status: 409, description: 'Tên danh mục cập nhật bị trùng' })
  update(
    @CurrentUser('id') userId: number | string,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ) {
    return this.categoriesService.update(id, updateCategoryDto, userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa danh mục theo ID (các task liên quan sẽ được set category_id = null)' })
  @ApiParam({ name: 'id', type: Number, description: 'ID danh mục' })
  @ApiResponse({ status: 200, description: 'Xóa danh mục thành công' })
  @ApiResponse({ status: 401, description: 'Chưa xác thực' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy danh mục hoặc không có quyền truy cập' })
  remove(
    @CurrentUser('id') userId: number | string,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.categoriesService.remove(id, userId);
  }
}
