import { IsOptional, IsString, MaxLength, ValidateIf } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateCategoryDto {
  @IsOptional()
  @ValidateIf((_, val) => val !== undefined && val !== null)
  @IsString({ message: 'Tên danh mục phải là chuỗi ký tự' })
  @MaxLength(100, { message: 'Tên danh mục không được vượt quá 100 ký tự' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  name?: string;

  @IsOptional()
  @IsString({ message: 'Mã màu phải là chuỗi ký tự' })
  @MaxLength(20, { message: 'Mã màu không được vượt quá 20 ký tự' })
  color?: string | null;

  @IsOptional()
  @IsString({ message: 'Icon phải là chuỗi ký tự' })
  @MaxLength(50, { message: 'Icon không được vượt quá 50 ký tự' })
  icon?: string | null;
}
