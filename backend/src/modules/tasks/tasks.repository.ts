import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';
import { QueryTaskDto } from './dto/query-task.dto.js';
import { task_status, task_priority } from '../../generated/prisma/enums.js';

@Injectable()
export class TasksRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: {
    user_id: number;
    title: string;
    notes?: string | null;
    category_id?: number | null;
    status: task_status;
    priority: task_priority;
    deadline?: Date | null;
    completed_at?: Date | null;
  }) {
    return this.prisma.tasks.create({
      data,
      include: {
        categories: {
          select: {
            id: true,
            name: true,
            color: true,
            icon: true,
          },
        },
      },
    });
  }

  async findAll(query: QueryTaskDto, userId: number) {
    const where: any = {
      user_id: userId,
    };

    // 1. Lọc cơ bản theo status, priority, categoryId
    if (query.status && query.status !== 'all') {
      where.status = query.status;
    }

    if (query.priority) {
      where.priority = query.priority;
    }

    const categoryId = query.categoryId ?? query.category_id;
    if (categoryId !== undefined && categoryId !== null) {
      where.category_id = categoryId;
    }

    // 2. Search (search): Tìm kiếm contains không phân biệt hoa thường (mode: 'insensitive') trên cả title và notes
    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { notes: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    // 3. Lọc theo view (view):
    // - overdue: Các task chưa DONE và có deadline < NOW()
    // - today: Các task có deadline nằm trong khoảng thời gian của ngày hôm nay
    // - upcoming: Các task có deadline trong tương lai
    if (query.view) {
      const now = new Date();
      if (query.view === 'today') {
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
        const endOfDay = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate(),
          23,
          59,
          59,
          999,
        );
        where.deadline = { gte: startOfDay, lte: endOfDay };
      } else if (query.view === 'upcoming') {
        where.deadline = { gt: now };
      } else if (query.view === 'overdue') {
        where.deadline = { not: null, lt: now };
        if (!where.status) {
          where.status = { not: task_status.DONE };
        } else if (where.status === task_status.DONE) {
          where.id = -1; // Task không thể vừa DONE vừa overdue
        }
      }
    }

    // 4. Sắp xếp (sort, order): Mặc định createdAt: 'desc', hỗ trợ deadline, priority, title
    const rawSort = query.sort || query.sort_by || 'createdAt';
    let sortField = 'created_at';
    if (rawSort === 'deadline') {
      sortField = 'deadline';
    } else if (rawSort === 'priority') {
      sortField = 'priority';
    } else if (rawSort === 'title') {
      sortField = 'title';
    } else {
      sortField = 'created_at';
    }
    const sortOrder = query.order === 'asc' ? 'asc' : 'desc';

    // 5. Phân trang (page, limit): skip = (page - 1) * limit
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 20));
    const skip = (page - 1) * limit;

    const [tasks, total] = await Promise.all([
      this.prisma.tasks.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          [sortField]: sortOrder,
        },
        include: {
          categories: {
            select: {
              id: true,
              name: true,
              color: true,
              icon: true,
            },
          },
        },
      }),
      this.prisma.tasks.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: tasks,
      meta: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }

  async findById(id: number, userId: number) {
    return this.prisma.tasks.findFirst({
      where: {
        id,
        user_id: userId,
      },
      include: {
        categories: {
          select: {
            id: true,
            name: true,
            color: true,
            icon: true,
          },
        },
      },
    });
  }

  async update(
    id: number,
    data: {
      title?: string;
      notes?: string | null;
      category_id?: number | null;
      status?: task_status;
      priority?: task_priority;
      deadline?: Date | null;
      completed_at?: Date | null;
    },
  ) {
    return this.prisma.tasks.update({
      where: { id },
      data: {
        ...data,
        updated_at: new Date(),
      },
      include: {
        categories: {
          select: {
            id: true,
            name: true,
            color: true,
            icon: true,
          },
        },
      },
    });
  }

  async delete(id: number) {
    return this.prisma.tasks.delete({
      where: { id },
    });
  }
}
