import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { PrismaService } from '../src/database/prisma.service.js';

describe('CategoriesController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let user1Token: string;
  let user1Id: number;
  let user2Token: string;
  let _user2Id: number;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();

    prisma = app.get(PrismaService);

    // Tạo User 1
    const email1 = `cat_user1_${Date.now()}_${Math.random()}@example.com`;
    await request(app.getHttpServer()).post('/api/auth/register').send({
      name: 'User 1',
      email: email1,
      password: 'password123',
    });
    const loginRes1 = await request(app.getHttpServer()).post('/api/auth/login').send({
      email: email1,
      password: 'password123',
    });
    user1Token = loginRes1.body.access_token;
    user1Id = loginRes1.body.user.id;

    // Tạo User 2
    const email2 = `cat_user2_${Date.now()}_${Math.random()}@example.com`;
    await request(app.getHttpServer()).post('/api/auth/register').send({
      name: 'User 2',
      email: email2,
      password: 'password123',
    });
    const loginRes2 = await request(app.getHttpServer()).post('/api/auth/login').send({
      email: email2,
      password: 'password123',
    });
    user2Token = loginRes2.body.access_token;
    _user2Id = loginRes2.body.user.id;
  });

  afterEach(async () => {
    await app.close();
  });

  it('1. POST /api/categories - Tạo danh mục mới thành công', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/categories')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({
        name: 'Work',
        color: '#FF5733',
        icon: 'briefcase',
      });

    expect(response.status).toBe(201);
    expect(response.body.name).toBe('Work');
    expect(response.body.color).toBe('#FF5733');
    expect(response.body.icon).toBe('briefcase');
    expect(response.body.user_id).toBe(user1Id);
  });

  it('2. POST /api/categories - Trùng tên danh mục cùng user trả về 409 Conflict', async () => {
    // Tạo lần đầu
    await request(app.getHttpServer())
      .post('/api/categories')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({
        name: 'Study',
        color: '#123456',
        icon: 'book',
      });

    // Tạo lại với cùng tên
    const dupResponse = await request(app.getHttpServer())
      .post('/api/categories')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({
        name: 'Study',
        color: '#654321',
        icon: 'pencil',
      });

    expect(dupResponse.status).toBe(409);
  });

  it('3. GET /api/categories - Lấy danh sách category thuộc quyền sở hữu của user', async () => {
    // User 1 tạo 2 category
    await request(app.getHttpServer())
      .post('/api/categories')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ name: 'Personal' });
    await request(app.getHttpServer())
      .post('/api/categories')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ name: 'Finance' });

    // User 2 tạo 1 category
    await request(app.getHttpServer())
      .post('/api/categories')
      .set('Authorization', `Bearer ${user2Token}`)
      .send({ name: 'Secret' });

    // User 1 lấy danh sách: chỉ thấy 2 category của mình
    const resUser1 = await request(app.getHttpServer())
      .get('/api/categories')
      .set('Authorization', `Bearer ${user1Token}`);

    expect(resUser1.status).toBe(200);
    expect(Array.isArray(resUser1.body)).toBe(true);
    expect(resUser1.body.length).toBe(2);
    expect(resUser1.body.map((c: any) => c.name)).toContain('Personal');
    expect(resUser1.body.map((c: any) => c.name)).toContain('Finance');
    expect(resUser1.body.map((c: any) => c.name)).not.toContain('Secret');
  });

  it('4. PATCH /api/categories/:id - Cập nhật thông tin danh mục', async () => {
    const createRes = await request(app.getHttpServer())
      .post('/api/categories')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ name: 'Old Name', color: '#111111' });

    const catId = createRes.body.id;

    const updateRes = await request(app.getHttpServer())
      .patch(`/api/categories/${catId}`)
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ name: 'New Name', color: '#222222', icon: 'star' });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.name).toBe('New Name');
    expect(updateRes.body.color).toBe('#222222');
    expect(updateRes.body.icon).toBe('star');
  });

  it('5. DELETE /api/categories/:id - Xóa danh mục và chuyển task liên quan thành category_id = null', async () => {
    // User 1 tạo category
    const catRes = await request(app.getHttpServer())
      .post('/api/categories')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ name: 'Category To Delete' });

    const catId = catRes.body.id;

    // Tạo một task gắn category này trong DB
    const task = await prisma.tasks.create({
      data: {
        title: 'Task in category',
        user_id: user1Id,
        category_id: catId,
      },
    });
    expect(task.category_id).toBe(catId);

    // Xóa category
    const deleteRes = await request(app.getHttpServer())
      .delete(`/api/categories/${catId}`)
      .set('Authorization', `Bearer ${user1Token}`);

    expect(deleteRes.status).toBe(200);

    // Kiểm tra task: category_id đã thành null (onDelete: SetNull)
    const updatedTask = await prisma.tasks.findUnique({
      where: { id: task.id },
    });
    expect(updatedTask?.category_id).toBeNull();

    // GET category đã xóa -> 404
    const getRes = await request(app.getHttpServer())
      .get(`/api/categories/${catId}`)
      .set('Authorization', `Bearer ${user1Token}`);

    expect(getRes.status).toBe(404);
  });

  it('6. Tenant Isolation - Không cho phép truy cập, sửa hoặc xóa danh mục của người dùng khác', async () => {
    // User 2 tạo category
    const catUser2Res = await request(app.getHttpServer())
      .post('/api/categories')
      .set('Authorization', `Bearer ${user2Token}`)
      .send({ name: 'User2 Private' });

    const user2CatId = catUser2Res.body.id;

    // User 1 cố tình GET category của User 2 -> 404
    const getRes = await request(app.getHttpServer())
      .get(`/api/categories/${user2CatId}`)
      .set('Authorization', `Bearer ${user1Token}`);
    expect(getRes.status).toBe(404);

    // User 1 cố tình PATCH category của User 2 -> 404
    const patchRes = await request(app.getHttpServer())
      .patch(`/api/categories/${user2CatId}`)
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ name: 'Hacked' });
    expect(patchRes.status).toBe(404);

    // User 1 cố tình DELETE category của User 2 -> 404
    const deleteRes = await request(app.getHttpServer())
      .delete(`/api/categories/${user2CatId}`)
      .set('Authorization', `Bearer ${user1Token}`);
    expect(deleteRes.status).toBe(404);

    // Xác nhận category của User 2 vẫn an toàn nguyên vẹn
    const verifyRes = await request(app.getHttpServer())
      .get(`/api/categories/${user2CatId}`)
      .set('Authorization', `Bearer ${user2Token}`);
    expect(verifyRes.status).toBe(200);
    expect(verifyRes.body.name).toBe('User2 Private');
  });
});
