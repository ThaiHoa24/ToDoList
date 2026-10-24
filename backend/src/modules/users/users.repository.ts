import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';
import { UpdateUserDto } from './dto/update-user.dto.js';

@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: number | string) {
    const numericId = Number(id);
    if (Number.isNaN(numericId)) return null;

    return this.prisma.users.findUnique({
      where: { id: numericId },
      select: {
        id: true,
        name: true,
        email: true,
        created_at: true,
        updated_at: true,
      },
    });
  }

  async findByEmail(_email: string) {
    // TODO: Query user by email from database
    return null;
  }

  async update(id: string, dto: UpdateUserDto) {
    // TODO: Update user record in database
    return { id, ...dto };
  }
}
