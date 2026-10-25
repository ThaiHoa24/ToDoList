import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { TasksRepository } from './tasks.repository.js';
import { PrismaService } from '../../database/prisma.service.js';
import { CreateTaskDto } from './dto/create-task.dto.js';
import { UpdateTaskDto } from './dto/update-task.dto.js';
import { QueryTaskDto } from './dto/query-task.dto.js';
import { task_status, task_priority } from '../../generated/prisma/enums.js';

@Injectable()
export class TasksService {
  constructor(
    private readonly tasksRepository: TasksRepository,
    private readonly prisma: PrismaService,
  ) {}

  private parseNumericId(id: number | string, entityName = 'ID'): number {
    const numericId = Number(id);
    if (Number.isNaN(numericId) || !Number.isInteger(numericId) || numericId <= 0) {
      throw new BadRequestException(`${entityName} không hợp lệ`);
    }
    return numericId;
  }

  async create(createTaskDto: CreateTaskDto, userId: number | string) {
    const numericUserId = this.parseNumericId(userId, 'User ID');

    // 1. Kiểm tra Category nếu được truyền vào
    if (createTaskDto.category_id !== undefined && createTaskDto.category_id !== null) {
      const category = await this.prisma.categories.findFirst({
        where: {
          id: createTaskDto.category_id,
          user_id: numericUserId,
        },
      });

      if (!category) {
        throw new NotFoundException(
          'Không tìm thấy danh mục hoặc bạn không có quyền sử dụng danh mục này',
        );
      }
    }

    // 2. Lifecycle completed_at khi tạo mới
    const status = createTaskDto.status || task_status.TODO;
    const priority = createTaskDto.priority || task_priority.MEDIUM;
    const completed_at = status === task_status.DONE ? new Date() : null;

    return this.tasksRepository.create({
      user_id: numericUserId,
      title: createTaskDto.title,
      notes: createTaskDto.notes ?? null,
      category_id: createTaskDto.category_id ?? null,
      status,
      priority,
      deadline: createTaskDto.deadline ?? null,
      completed_at,
    });
  }

  async findAll(query: QueryTaskDto, userId: number | string) {
    const numericUserId = this.parseNumericId(userId, 'User ID');
    return this.tasksRepository.findAll(query, numericUserId);
  }

  async findOne(id: number | string, userId: number | string) {
    const numericId = this.parseNumericId(id, 'Task ID');
    const numericUserId = this.parseNumericId(userId, 'User ID');

    const task = await this.tasksRepository.findById(numericId, numericUserId);
    if (!task) {
      throw new NotFoundException('Không tìm thấy task hoặc bạn không có quyền truy cập');
    }

    return task;
  }

  async update(
    id: number | string,
    updateTaskDto: UpdateTaskDto,
    userId: number | string,
  ) {
    const numericId = this.parseNumericId(id, 'Task ID');
    const numericUserId = this.parseNumericId(userId, 'User ID');

    // 1. Kiểm tra tồn tại và quyền sở hữu (Tenant Isolation)
    const existingTask = await this.tasksRepository.findById(numericId, numericUserId);
    if (!existingTask) {
      throw new NotFoundException('Không tìm thấy task hoặc bạn không có quyền truy cập');
    }

    // 2. Kiểm tra quyền sở hữu category_id nếu có cập nhật
    if (updateTaskDto.category_id !== undefined && updateTaskDto.category_id !== null) {
      const category = await this.prisma.categories.findFirst({
        where: {
          id: updateTaskDto.category_id,
          user_id: numericUserId,
        },
      });

      if (!category) {
        throw new NotFoundException(
          'Không tìm thấy danh mục hoặc bạn không có quyền sử dụng danh mục này',
        );
      }
    }

    // 3. Lifecycle completed_at khi thay đổi status
    let completed_at = existingTask.completed_at;
    if (updateTaskDto.status !== undefined) {
      if (updateTaskDto.status === task_status.DONE && existingTask.status !== task_status.DONE) {
        completed_at = new Date();
      } else if (updateTaskDto.status !== task_status.DONE && existingTask.status === task_status.DONE) {
        completed_at = null;
      }
    }

    const dataToUpdate: {
      title?: string;
      notes?: string | null;
      category_id?: number | null;
      status?: task_status;
      priority?: task_priority;
      deadline?: Date | null;
      completed_at?: Date | null;
    } = {};

    if (updateTaskDto.title !== undefined) dataToUpdate.title = updateTaskDto.title;
    if (updateTaskDto.notes !== undefined) dataToUpdate.notes = updateTaskDto.notes;
    if (updateTaskDto.category_id !== undefined) dataToUpdate.category_id = updateTaskDto.category_id;
    if (updateTaskDto.status !== undefined) {
      dataToUpdate.status = updateTaskDto.status;
      dataToUpdate.completed_at = completed_at;
    }
    if (updateTaskDto.priority !== undefined) dataToUpdate.priority = updateTaskDto.priority;
    if (updateTaskDto.deadline !== undefined) dataToUpdate.deadline = updateTaskDto.deadline;

    return this.tasksRepository.update(numericId, dataToUpdate);
  }

  async remove(id: number | string, userId: number | string) {
    const numericId = this.parseNumericId(id, 'Task ID');
    const numericUserId = this.parseNumericId(userId, 'User ID');

    // Kiểm tra tồn tại và quyền sở hữu (Tenant Isolation)
    const existingTask = await this.tasksRepository.findById(numericId, numericUserId);
    if (!existingTask) {
      throw new NotFoundException('Không tìm thấy task hoặc bạn không có quyền truy cập');
    }

    await this.tasksRepository.delete(numericId);
    return {
      success: true,
      data: {
        deletedId: numericId,
      },
    };
  }
}
