import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';
import { CreateTaskDto } from './dto/create-task.dto.js';
import { UpdateTaskDto } from './dto/update-task.dto.js';
import { QueryTaskDto } from './dto/query-task.dto.js';

@Injectable()
export class TasksRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(createTaskDto: CreateTaskDto, userId: string) {
    // TODO: Create task in DB via Prisma
    return { id: 'mock-task-id', ...createTaskDto, userId };
  }

  async findAll(_query: QueryTaskDto, _userId: string) {
    // TODO: Query tasks by userId with filters & pagination
    return [];
  }

  async findById(id: string, userId: string) {
    // TODO: Query single task by id and userId
    return { id, userId };
  }

  async update(id: string, updateTaskDto: UpdateTaskDto, userId: string) {
    // TODO: Update task in DB
    return { id, ...updateTaskDto, userId };
  }

  async delete(id: string, userId: string) {
    // TODO: Delete task in DB
    return { id, userId, deleted: true };
  }
}
