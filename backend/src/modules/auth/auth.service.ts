import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcrypt';
import { PrismaService } from '../../database/prisma.service.js';
import { UsersService } from '../users/users.service.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    if (!dto?.email || !dto?.password) {
      throw new BadRequestException('Email và mật khẩu không được để trống');
    }

    // 1. Kiểm tra email đã tồn tại trong hệ thống chưa
    const existingUser = await this.prisma.users.findUnique({
      where: { email: dto.email },
    });

    // 2. Nếu đã tồn tại, ném ConflictException (HTTP 409)
    if (existingUser) {
      throw new ConflictException('Email đã tồn tại trong hệ thống');
    }

    // 3. Băm mật khẩu với bcrypt (salt rounds = 10)
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    // 4. Lưu user mới vào cơ sở dữ liệu
    const newUser = await this.prisma.users.create({
      data: {
        name: dto.name,
        email: dto.email,
        password_hash: hashedPassword,
      },
    });

    // 5. Loại bỏ trường password_hash trước khi trả về
    const { password_hash: _passwordHash, ...userWithoutPassword } = newUser;
    return userWithoutPassword;
  }

  async login(dto: LoginDto) {
    if (!dto?.email || !dto?.password) {
      throw new UnauthorizedException('Email hoặc mật khẩu không chính xác');
    }

    // 1. Tìm User
    const user = await this.prisma.users.findUnique({
      where: { email: dto.email },
    });

    // 2. Kiểm tra tồn tại
    if (!user) {
      throw new UnauthorizedException('Email hoặc mật khẩu không chính xác');
    }

    // 3. So sánh mật khẩu
    const isPasswordMatched = await bcrypt.compare(dto.password, user.password_hash);

    // 4. Kiểm tra khớp mật khẩu
    if (!isPasswordMatched) {
      throw new UnauthorizedException('Email hoặc mật khẩu không chính xác');
    }

    // 5. Tạo Payload & Ký sinh JWT
    const payload = { sub: user.id, email: user.email };
    const accessToken = await this.jwtService.signAsync(payload);

    // 6. Trả về kết quả
    return {
      access_token: accessToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    };
  }

  async logout() {
    // TODO: Clear authentication cookie/session
    return { message: 'Logout successful' };
  }

  async getMe(userId: number | string) {
    return this.usersService.findById(userId);
  }
}
