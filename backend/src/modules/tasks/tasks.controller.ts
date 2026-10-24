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
} from '@nestjs/common';
import { TasksService } from './tasks.service.js';
import { CreateTaskDto } from './dto/create-task.dto.js';
import { UpdateTaskDto } from './dto/update-task.dto.js';
import { QueryTaskDto } from './dto/query-task.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';

@Controller('tasks')
@UseGuards(JwtAuthGuard)
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  create(
    @CurrentUser('id') userId: string,
    @Body() createTaskDto: CreateTaskDto,
  ) {
    const currentId = userId || 'mock-user-id';
    return this.tasksService.create(createTaskDto, currentId);
  }

  @Get()
  findAll(
    @CurrentUser('id') userId: string,
    @Query() query: QueryTaskDto,
  ) {
    const currentId = userId || 'mock-user-id';
    return this.tasksService.findAll(query, currentId);
  }

  @Get(':id')
  findOne(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    const currentId = userId || 'mock-user-id';
    return this.tasksService.findOne(id, currentId);
  }

  @Patch(':id')
  update(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() updateTaskDto: UpdateTaskDto,
  ) {
    const currentId = userId || 'mock-user-id';
    return this.tasksService.update(id, updateTaskDto, currentId);
  }

  @Delete(':id')
  remove(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    const currentId = userId || 'mock-user-id';
    return this.tasksService.remove(id, currentId);
  }
}
