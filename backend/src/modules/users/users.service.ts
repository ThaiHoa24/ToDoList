import { Injectable } from '@nestjs/common';
import { UsersRepository } from './users.repository.js';
import { UpdateUserDto } from './dto/update-user.dto.js';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async findById(id: number | string) {
    return this.usersRepository.findById(id);
  }

  async findByEmail(email: string) {
    return this.usersRepository.findByEmail(email);
  }

  async updateProfile(id: string, dto: UpdateUserDto) {
    return this.usersRepository.update(id, dto);
  }
}
