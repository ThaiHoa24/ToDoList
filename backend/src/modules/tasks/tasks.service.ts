import { Injectable } from '@nestjs/common';
import { TasksRepository } from './tasks.repository.js';
import { CreateTaskDto } from './dto/create-task.dto.js';
import { UpdateTaskDto } from './dto/update-task.dto.js';
import { QueryTaskDto } from './dto/query-task.dto.js';

@Injectable()
export class TasksService {
  constructor(private readonly tasksRepository: TasksRepository) {}

  async create(createTaskDto: CreateTaskDto, userId: string) {
    return this.tasksRepository.create(createTaskDto, userId);
  }

  async findAll(query: QueryTaskDto, userId: string) {
    return this.tasksRepository.findAll(query, userId);
  }

  async findOne(id: string, userId: string) {
    return this.tasksRepository.findById(id, userId);
  }

  async update(id: string, updateTaskDto: UpdateTaskDto, userId: string) {
    return this.tasksRepository.update(id, updateTaskDto, userId);
  }

  async remove(id: string, userId: string) {
    return this.tasksRepository.delete(id, userId);
  }
}
