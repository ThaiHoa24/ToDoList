import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { task_priority, task_status } from '../../../generated/prisma/enums.js';

export class CreateTaskDto {
  @ApiProperty({
    example: 'Hoàn thành bài tập NestJS',
    description: 'Tiêu đề của task (bắt buộc, max 255 ký tự)',
  })
  @IsNotEmpty({ message: 'Tiêu đề task không được để trống' })
  @IsString({ message: 'Tiêu đề task phải là chuỗi ký tự' })
  @MaxLength(255, { message: 'Tiêu đề task không được vượt quá 255 ký tự' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  title: string;

  @ApiPropertyOptional({
    example: 'Tập trung vào phần validation DTO và filter',
    description: 'Ghi chú chi tiết cho task',
  })
  @IsOptional()
  @IsString({ message: 'Ghi chú phải là chuỗi ký tự' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  notes?: string | null;

  @ApiPropertyOptional({
    example: 1,
    description: 'ID danh mục liên kết (phải thuộc sở hữu của user)',
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
    example: task_status.TODO,
    description: 'Trạng thái task: TODO, IN_PROGRESS, REVIEW, DONE',
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
    example: task_priority.MEDIUM,
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
    example: '2026-10-30T23:59:59.000Z',
    description: 'Hạn chót hoàn thành task (định dạng ISO-8601)',
  })
  @IsOptional()
  @ValidateIf((_, val) => val !== null && val !== undefined && val !== '')
  @Transform(({ value }) => {
    if (!value || value === '') return null;
    return typeof value === 'string' ? new Date(value) : value;
  })
  deadline?: Date | null;
}
