import { IsOptional, IsString, MaxLength, ValidateIf } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateCategoryDto {
  @ApiPropertyOptional({
    example: 'Công việc & Dự án',
    description: 'Tên danh mục mới (max 100 ký tự)',
  })
  @IsOptional()
  @ValidateIf((_, val) => val !== undefined && val !== null)
  @IsString({ message: 'Tên danh mục phải là chuỗi ký tự' })
  @MaxLength(100, { message: 'Tên danh mục không được vượt quá 100 ký tự' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  name?: string;

  @ApiPropertyOptional({
    example: '#10B981',
    description: 'Mã màu mới (tối đa 20 ký tự)',
  })
  @IsOptional()
  @IsString({ message: 'Mã màu phải là chuỗi ký tự' })
  @MaxLength(20, { message: 'Mã màu không được vượt quá 20 ký tự' })
  color?: string | null;

  @ApiPropertyOptional({
    example: 'folder',
    description: 'Tên icon mới (tối đa 50 ký tự)',
  })
  @IsOptional()
  @IsString({ message: 'Icon phải là chuỗi ký tự' })
  @MaxLength(50, { message: 'Icon không được vượt quá 50 ký tự' })
  icon?: string | null;
}
