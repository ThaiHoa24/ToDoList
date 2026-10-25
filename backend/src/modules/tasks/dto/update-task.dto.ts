import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { task_priority, task_status } from '../../../generated/prisma/enums.js';

export class UpdateTaskDto {
  @ApiPropertyOptional({
    example: 'Hoàn thành bài tập NestJS nâng cao',
    description: 'Tiêu đề cập nhật (max 255 ký tự)',
  })
  @IsOptional()
  @ValidateIf((_, val) => val !== undefined && val !== null)
  @IsString({ message: 'Tiêu đề task phải là chuỗi ký tự' })
  @MaxLength(255, { message: 'Tiêu đề task không được vượt quá 255 ký tự' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  title?: string;

  @ApiPropertyOptional({
    example: 'Đã hoàn thiện các test case',
    description: 'Ghi chú cập nhật',
  })
  @IsOptional()
  @IsString({ message: 'Ghi chú phải là chuỗi ký tự' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  notes?: string | null;

  @ApiPropertyOptional({
    example: 1,
    description: 'ID danh mục mới (phải thuộc sở hữu của user)',
  })
  @IsOptional()
  @ValidateIf((_, val) => val !== null && val !== undefined)
  @IsInt({ message: 'Category ID phải là số nguyên' })
  @Transform(({ value, obj }) => {
    const raw = value ?? obj?.categoryId;
    if (raw === null || raw === undefined || raw === '') return null;
    const num = Number(raw);
    return Number.isNaN(num) ? raw : num;
  })
  category_id?: number | null;

  @ApiPropertyOptional({
    enum: task_status,
    example: task_status.DONE,
    description: 'Trạng thái mới (chuyển sang DONE sẽ tự động set completed_at)',
  })
  @IsOptional()
  @IsEnum(task_status, {
    message: 'Trạng thái phải là TODO, IN_PROGRESS, REVIEW hoặc DONE',
  })
  @Transform(({ value }) => {
    if (typeof value !== 'string') return value;
    const upper = value.trim().toUpperCase();
    if (upper === 'PROGRESS') return task_status.IN_PROGRESS;
    return upper;
  })
  status?: task_status;

  @ApiPropertyOptional({
    enum: task_priority,
    example: task_priority.HIGH,
    description: 'Độ ưu tiên: LOW, MEDIUM, HIGH',
  })
  @IsOptional()
  @IsEnum(task_priority, {
    message: 'Độ ưu tiên phải là LOW, MEDIUM hoặc HIGH',
  })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toUpperCase() : value,
  )
  priority?: task_priority;

  @ApiPropertyOptional({
    example: '2026-11-01T00:00:00.000Z',
    description: 'Hạn chót mới',
  })
  @IsOptional()
  @ValidateIf((_, val) => val !== null && val !== undefined && val !== '')
  @Transform(({ value }) => {
    if (!value || value === '') return null;
    return typeof value === 'string' ? new Date(value) : value;
  })
  deadline?: Date | null;
}
