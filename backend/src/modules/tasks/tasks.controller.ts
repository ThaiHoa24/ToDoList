import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
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
import { TasksService } from './tasks.service.js';
import { CreateTaskDto } from './dto/create-task.dto.js';
import { UpdateTaskDto } from './dto/update-task.dto.js';
import { QueryTaskDto } from './dto/query-task.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';

@ApiTags('Tasks')
@ApiBearerAuth('JWT-auth')
@Controller('tasks')
@UseGuards(JwtAuthGuard)
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  @ApiOperation({ summary: 'Tạo Task mới (tự động gán user_id và completed_at nếu status=DONE)' })
  @ApiResponse({ status: 201, description: 'Tạo task thành công' })
  @ApiResponse({ status: 400, description: 'Dữ liệu đầu vào không hợp lệ' })
  @ApiResponse({ status: 401, description: 'Chưa xác thực Bearer token' })
  @ApiResponse({ status: 404, description: 'category_id không tồn tại hoặc không thuộc user' })
  create(
    @CurrentUser('id') userId: number,
    @Body() createTaskDto: CreateTaskDto,
  ) {
    return this.tasksService.create(createTaskDto, userId);
  }

  @Get()
  @ApiOperation({
    summary: 'Lấy danh sách Tasks (hỗ trợ search, filter status/priority/categoryId, filter view today/upcoming/overdue, sort và phân trang)',
  })
  @ApiResponse({
    status: 200,
    description: 'Danh sách task kèm metadata phân trang { data: [...], meta: { page, limit, total, totalPages } }',
  })
  @ApiResponse({ status: 401, description: 'Chưa xác thực Bearer token' })
  findAll(
    @CurrentUser('id') userId: number,
    @Query() query: QueryTaskDto,
  ) {
    return this.tasksService.findAll(query, userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy thông tin chi tiết một Task theo ID' })
  @ApiParam({ name: 'id', type: Number, description: 'ID của task' })
  @ApiResponse({ status: 200, description: 'Chi tiết task' })
  @ApiResponse({ status: 401, description: 'Chưa xác thực' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy task hoặc không có quyền truy cập' })
  findOne(
    @CurrentUser('id') userId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.tasksService.findOne(id, userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Cập nhật Task (quản lý lifecycle completed_at khi thay đổi status)' })
  @ApiParam({ name: 'id', type: Number, description: 'ID của task' })
  @ApiResponse({ status: 200, description: 'Cập nhật task thành công' })
  @ApiResponse({ status: 401, description: 'Chưa xác thực' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy task hoặc category không hợp lệ' })
  update(
    @CurrentUser('id') userId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTaskDto: UpdateTaskDto,
  ) {
    return this.tasksService.update(id, updateTaskDto, userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa Task theo ID' })
  @ApiParam({ name: 'id', type: Number, description: 'ID của task' })
  @ApiResponse({ status: 200, description: 'Xóa task thành công' })
  @ApiResponse({ status: 401, description: 'Chưa xác thực' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy task hoặc không có quyền truy cập' })
  remove(
    @CurrentUser('id') userId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.tasksService.remove(id, userId);
  }
}
