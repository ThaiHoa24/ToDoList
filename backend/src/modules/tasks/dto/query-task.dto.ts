import {
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { task_priority, task_status } from '../../../generated/prisma/enums.js';

export class QueryTaskDto {
  @ApiPropertyOptional({
    example: 'NestJS',
    description: 'Từ khóa tìm kiếm trong title hoặc notes (không phân biệt hoa thường)',
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  search?: string;

  @ApiPropertyOptional({
    example: 1,
    description: 'Lọc danh sách theo ID danh mục (categoryId)',
  })
  @IsOptional()
  @IsInt({ message: 'Category ID phải là số nguyên' })
  @Transform(({ value, obj }) => {
    const raw = value ?? obj?.category_id;
    if (raw === null || raw === undefined || raw === '') return undefined;
    const num = Number(raw);
    return Number.isNaN(num) ? raw : num;
  })
  categoryId?: number;

  @ApiPropertyOptional({
    example: 1,
    description: 'Alias của categoryId (category_id)',
  })
  @IsOptional()
  @IsInt({ message: 'Category ID phải là số nguyên' })
  @Transform(({ value, obj }) => {
    const raw = value ?? obj?.categoryId;
    if (raw === null || raw === undefined || raw === '') return undefined;
    const num = Number(raw);
    return Number.isNaN(num) ? raw : num;
  })
  category_id?: number;

  @ApiPropertyOptional({
    enum: ['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE', 'all'],
    example: 'all',
    default: 'all',
    description: 'Lọc theo trạng thái: TODO, IN_PROGRESS, REVIEW, DONE hoặc all (mặc định: all)',
  })
  @IsOptional()
  @IsIn(['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE', 'all'], {
    message: 'Trạng thái phải là TODO, IN_PROGRESS, REVIEW, DONE hoặc all',
  })
  @Transform(({ value }) => {
    if (typeof value !== 'string') return value;
    const trimmed = value.trim();
    if (trimmed.toLowerCase() === 'all') return 'all';
    const upper = trimmed.toUpperCase();
    if (upper === 'PROGRESS') return task_status.IN_PROGRESS;
    return upper;
  })
  status?: task_status | 'all';

  @ApiPropertyOptional({
    enum: task_priority,
    example: task_priority.HIGH,
    description: 'Lọc theo độ ưu tiên: LOW, MEDIUM, HIGH',
  })
  @IsOptional()
  @IsEnum(task_priority, {
    message: 'Độ ưu tiên phải là LOW, MEDIUM hoặc HIGH',
  })
  @Transform(({ value }) =>
    typeof value === 'string' ? (value.trim().toUpperCase() as task_priority) : value,
  )
  priority?: task_priority;

  @ApiPropertyOptional({
    enum: ['today', 'upcoming', 'overdue'],
    example: 'today',
    description: 'Lọc theo mốc thời gian deadline: today (trong ngày), upcoming (sắp tới), overdue (quá hạn)',
  })
  @IsOptional()
  @IsEnum(['today', 'upcoming', 'overdue'], {
    message: 'View phải là today, upcoming hoặc overdue',
  })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  view?: 'today' | 'upcoming' | 'overdue';

  @ApiPropertyOptional({
    enum: ['createdAt', 'deadline', 'priority', 'title', 'created_at'],
    example: 'createdAt',
    default: 'createdAt',
    description: 'Trường sắp xếp kết quả: createdAt, deadline, priority, title (mặc định: createdAt)',
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  sort?: string = 'createdAt';

  @ApiPropertyOptional({
    enum: ['createdAt', 'deadline', 'priority', 'title', 'created_at'],
    example: 'created_at',
    description: 'Alias cho sort (sort_by)',
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  sort_by?: string;

  @ApiPropertyOptional({
    enum: ['asc', 'desc'],
    example: 'desc',
    default: 'desc',
    description: 'Thứ tự sắp xếp: asc hoặc desc (mặc định: desc)',
  })
  @IsOptional()
  @IsEnum(['asc', 'desc'], { message: 'Order phải là asc hoặc desc' })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  order?: 'asc' | 'desc' = 'desc';

  @ApiPropertyOptional({
    example: 1,
    default: 1,
    description: 'Số thứ tự trang (>= 1, mặc định: 1)',
  })
  @IsOptional()
  @IsInt({ message: 'Trang phải là số nguyên' })
  @Min(1, { message: 'Trang phải lớn hơn hoặc bằng 1' })
  @Transform(({ value }) => {
    if (value === undefined || value === '') return 1;
    const num = Number(value);
    return Number.isNaN(num) ? value : num;
  })
  page?: number = 1;

  @ApiPropertyOptional({
    example: 20,
    default: 20,
    description: 'Số lượng task hiển thị trên mỗi trang (1-100, mặc định: 20)',
  })
  @IsOptional()
  @IsInt({ message: 'Số lượng mục trên trang phải là số nguyên' })
  @Min(1, { message: 'Limit phải lớn hơn hoặc bằng 1' })
  @Max(100, { message: 'Limit tối đa là 100' })
  @Transform(({ value }) => {
    if (value === undefined || value === '') return 20;
    const num = Number(value);
    return Number.isNaN(num) ? value : num;
  })
  limit?: number = 20;
}
