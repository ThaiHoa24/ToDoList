import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCategoryDto {
  @ApiProperty({
    example: 'Công việc',
    description: 'Tên danh mục (duy nhất theo từng user, max 100 ký tự)',
  })
  @IsNotEmpty({ message: 'Tên danh mục không được để trống' })
  @IsString({ message: 'Tên danh mục phải là chuỗi ký tự' })
  @MaxLength(100, { message: 'Tên danh mục không được vượt quá 100 ký tự' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  name: string;

  @ApiPropertyOptional({
    example: '#3B82F6',
    description: 'Mã màu hex hoặc tên màu (tối đa 20 ký tự)',
  })
  @IsOptional()
  @IsString({ message: 'Mã màu phải là chuỗi ký tự' })
  @MaxLength(20, { message: 'Mã màu không được vượt quá 20 ký tự' })
  color?: string | null;

  @ApiPropertyOptional({
    example: 'briefcase',
    description: 'Tên icon đại diện (tối đa 50 ký tự)',
  })
  @IsOptional()
  @IsString({ message: 'Icon phải là chuỗi ký tự' })
  @MaxLength(50, { message: 'Icon không được vượt quá 50 ký tự' })
  icon?: string | null;
}
