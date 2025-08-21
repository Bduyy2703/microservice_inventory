
import { IsEmail, IsString, IsOptional, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateProfileDto {
  @ApiProperty({ description: 'Email mới của người dùng', example: 'new.email@example.com' })
  @IsEmail({}, { message: 'Email không hợp lệ' })
  @IsOptional()
  email?: string;

  @ApiProperty({ description: 'Mật khẩu mới của người dùng', example: 'newPassword123' })
  @IsString()
  @IsOptional()
  @MinLength(6, { message: 'Mật khẩu phải dài ít nhất 6 ký tự' })
  password?: string;
}