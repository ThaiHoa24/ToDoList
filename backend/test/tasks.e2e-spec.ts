import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';

describe('TasksController (e2e)', () => {
  let app: INestApplication;
  let user1Token: string;
  let user1Id: number;
  let user2Token: string;
  let _user2Id: number;
  let user1CategoryId: number;
  let user2CategoryId: number;

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

    // 1. Tạo User 1
    const email1 = `task_user1_${Date.now()}_${Math.random()}@example.com`;
    await request(app.getHttpServer()).post('/api/auth/register').send({
      name: 'Task User 1',
      email: email1,
      password: 'password123',
    });
    const loginRes1 = await request(app.getHttpServer()).post('/api/auth/login').send({
      email: email1,
      password: 'password123',
    });
    user1Token = loginRes1.body.access_token;
    user1Id = loginRes1.body.user.id;

    // 2. Tạo Category cho User 1
    const cat1Res = await request(app.getHttpServer())
      .post('/api/categories')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ name: 'Work User 1' });
    user1CategoryId = cat1Res.body.id;

    // 3. Tạo User 2
    const email2 = `task_user2_${Date.now()}_${Math.random()}@example.com`;
    await request(app.getHttpServer()).post('/api/auth/register').send({
      name: 'Task User 2',
      email: email2,
      password: 'password123',
    });
    const loginRes2 = await request(app.getHttpServer()).post('/api/auth/login').send({
      email: email2,
      password: 'password123',
    });
    user2Token = loginRes2.body.access_token;
    _user2Id = loginRes2.body.user.id;

    // 4. Tạo Category cho User 2
    const cat2Res = await request(app.getHttpServer())
      .post('/api/categories')
      .set('Authorization', `Bearer ${user2Token}`)
      .send({ name: 'Private User 2' });
    user2CategoryId = cat2Res.body.id;
  });

  afterEach(async () => {
    await app.close();
  });

  it('1. POST /api/tasks - Tạo task mới thành công và gán user_id từ token', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/tasks')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({
        title: 'Complete homework',
        notes: 'Math and physics',
        priority: 'HIGH',
        category_id: user1CategoryId,
      });

    expect(res.status).toBe(201);
    expect(res.body.title).toBe('Complete homework');
    expect(res.body.user_id).toBe(user1Id);
    expect(res.body.status).toBe('TODO');
    expect(res.body.priority).toBe('HIGH');
    expect(res.body.completed_at).toBeNull();
    expect(res.body.categories?.name).toBe('Work User 1');
  });

  it('2. POST /api/tasks - Tạo task với status = DONE tự động gán completed_at', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/tasks')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({
        title: 'Already finished task',
        status: 'DONE',
      });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe('DONE');
    expect(res.body.completed_at).not.toBeNull();
  });

  it('3. POST /api/tasks - Gán category_id của người khác trả về 404', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/tasks')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({
        title: 'Illegal category task',
        category_id: user2CategoryId,
      });

    expect(res.status).toBe(404);
  });

  it('4. GET /api/tasks - Lấy danh sách task kèm Tenant Isolation và lọc', async () => {
    // User 1 tạo 2 task
    await request(app.getHttpServer())
      .post('/api/tasks')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ title: 'Task A', status: 'TODO', priority: 'LOW' });
    await request(app.getHttpServer())
      .post('/api/tasks')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ title: 'Task B', status: 'DONE', priority: 'HIGH' });

    // User 2 tạo 1 task
    await request(app.getHttpServer())
      .post('/api/tasks')
      .set('Authorization', `Bearer ${user2Token}`)
      .send({ title: 'User 2 Secret Task' });

    // User 1 lấy danh sách: chỉ thấy 2 task của mình kèm metadata chuẩn
    const res = await request(app.getHttpServer())
      .get('/api/tasks')
      .set('Authorization', `Bearer ${user1Token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBe(2);
    expect(res.body.meta).toEqual({
      page: 1,
      limit: 20,
      total: 2,
      totalPages: 1,
    });
    expect(res.body.data.map((t: any) => t.title)).toContain('Task A');
    expect(res.body.data.map((t: any) => t.title)).toContain('Task B');
    expect(res.body.data.map((t: any) => t.title)).not.toContain('User 2 Secret Task');

    // Lọc theo status = DONE
    const filterDoneRes = await request(app.getHttpServer())
      .get('/api/tasks?status=DONE')
      .set('Authorization', `Bearer ${user1Token}`);

    expect(filterDoneRes.body.data.length).toBe(1);
    expect(filterDoneRes.body.data[0].title).toBe('Task B');
    expect(filterDoneRes.body.meta.total).toBe(1);
  });

  it('5. GET & DELETE /api/tasks/:id - Truy vấn đúng id và user_id, 404 nếu không sở hữu', async () => {
    // User 1 tạo task
    const createRes = await request(app.getHttpServer())
      .post('/api/tasks')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ title: 'Task to view/delete' });
    const taskId = createRes.body.id;

    // User 1 GET task thành công
    const getRes = await request(app.getHttpServer())
      .get(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${user1Token}`);
    expect(getRes.status).toBe(200);
    expect(getRes.body.id).toBe(taskId);

    // User 2 cố tình GET task của User 1 -> 404
    const user2GetRes = await request(app.getHttpServer())
      .get(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${user2Token}`);
    expect(user2GetRes.status).toBe(404);

    // User 2 cố tình DELETE task của User 1 -> 404
    const user2DelRes = await request(app.getHttpServer())
      .delete(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${user2Token}`);
    expect(user2DelRes.status).toBe(404);

    // ParseIntPipe kiểm tra id không hợp lệ -> 400
    const invalidIdRes = await request(app.getHttpServer())
      .get('/api/tasks/not-a-number')
      .set('Authorization', `Bearer ${user1Token}`);
    expect(invalidIdRes.status).toBe(400);

    // User 1 xóa task của mình -> 200
    const delRes = await request(app.getHttpServer())
      .delete(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${user1Token}`);
    expect(delRes.status).toBe(200);

    // Sau khi xóa, GET lại -> 404
    const verifyDelRes = await request(app.getHttpServer())
      .get(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${user1Token}`);
    expect(verifyDelRes.status).toBe(404);
  });

  it('6. PATCH /api/tasks/:id - Lifecycle completed_at khi đổi status', async () => {
    // Tạo task ban đầu TODO
    const createRes = await request(app.getHttpServer())
      .post('/api/tasks')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ title: 'Task Lifecycle' });
    const taskId = createRes.body.id;
    expect(createRes.body.completed_at).toBeNull();

    // 1. Chuyển sang DONE: gán completed_at = Date
    const patchDoneRes = await request(app.getHttpServer())
      .patch(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ status: 'DONE' });
    expect(patchDoneRes.status).toBe(200);
    expect(patchDoneRes.body.status).toBe('DONE');
    expect(patchDoneRes.body.completed_at).not.toBeNull();
    const completedAtDone = patchDoneRes.body.completed_at;

    // 2. Cập nhật title khi vẫn là DONE: giữ nguyên completed_at
    const patchTitleRes = await request(app.getHttpServer())
      .patch(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ title: 'Updated Title' });
    expect(patchTitleRes.status).toBe(200);
    expect(patchTitleRes.body.completed_at).toBe(completedAtDone);

    // 3. Rời khỏi DONE (sang IN_PROGRESS): đặt completed_at = null
    const patchProgressRes = await request(app.getHttpServer())
      .patch(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ status: 'IN_PROGRESS' });
    expect(patchProgressRes.status).toBe(200);
    expect(patchProgressRes.body.status).toBe('IN_PROGRESS');
    expect(patchProgressRes.body.completed_at).toBeNull();
  });

  it('7. GET /api/tasks - Tìm kiếm contains insensitive trên title và notes', async () => {
    await request(app.getHttpServer())
      .post('/api/tasks')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ title: 'Learn NestJS basics', notes: 'Read docs about modules' });
    await request(app.getHttpServer())
      .post('/api/tasks')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ title: 'Prisma ORM setup', notes: 'Learn about nested relations' });
    await request(app.getHttpServer())
      .post('/api/tasks')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ title: 'Cooking dinner', notes: 'Rice and chicken' });

    // Search 'nestjs' trong title
    const res1 = await request(app.getHttpServer())
      .get('/api/tasks?search=nestjs')
      .set('Authorization', `Bearer ${user1Token}`);
    expect(res1.status).toBe(200);
    expect(res1.body.data.length).toBe(1);
    expect(res1.body.data[0].title).toBe('Learn NestJS basics');

    // Search 'relations' trong notes (case-insensitive)
    const res2 = await request(app.getHttpServer())
      .get('/api/tasks?search=RELATIONS')
      .set('Authorization', `Bearer ${user1Token}`);
    expect(res2.status).toBe(200);
    expect(res2.body.data.length).toBe(1);
    expect(res2.body.data[0].title).toBe('Prisma ORM setup');
  });

  it('8. GET /api/tasks - Lọc theo view (today, upcoming, overdue)', async () => {
    const now = new Date();
    const pastDate = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
    const futureDate = new Date(now.getTime() + 48 * 60 * 60 * 1000).toISOString();
    const todayDate = new Date().toISOString();

    // 1. Task quá hạn chưa hoàn thành
    await request(app.getHttpServer())
      .post('/api/tasks')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ title: 'Overdue task', deadline: pastDate, status: 'TODO' });

    // 2. Task quá hạn nhưng đã DONE (không được coi là overdue)
    await request(app.getHttpServer())
      .post('/api/tasks')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ title: 'Finished overdue task', deadline: pastDate, status: 'DONE' });

    // 3. Task hôm nay
    await request(app.getHttpServer())
      .post('/api/tasks')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ title: 'Today task', deadline: todayDate, status: 'TODO' });

    // 4. Task tương lai
    await request(app.getHttpServer())
      .post('/api/tasks')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ title: 'Upcoming task', deadline: futureDate, status: 'TODO' });

    // Test view=overdue
    const overdueRes = await request(app.getHttpServer())
      .get('/api/tasks?view=overdue')
      .set('Authorization', `Bearer ${user1Token}`);
    expect(overdueRes.status).toBe(200);
    expect(overdueRes.body.data.map((t: any) => t.title)).toContain('Overdue task');
    expect(overdueRes.body.data.map((t: any) => t.title)).not.toContain('Finished overdue task');

    // Test view=today
    const todayRes = await request(app.getHttpServer())
      .get('/api/tasks?view=today')
      .set('Authorization', `Bearer ${user1Token}`);
    expect(todayRes.status).toBe(200);
    expect(todayRes.body.data.map((t: any) => t.title)).toContain('Today task');

    // Test view=upcoming
    const upcomingRes = await request(app.getHttpServer())
      .get('/api/tasks?view=upcoming')
      .set('Authorization', `Bearer ${user1Token}`);
    expect(upcomingRes.status).toBe(200);
    expect(upcomingRes.body.data.map((t: any) => t.title)).toContain('Upcoming task');
  });

  it('9. GET /api/tasks - Sắp xếp (sort, order) và Phân trang (page, limit)', async () => {
    // Tạo 5 task
    for (let i = 1; i <= 5; i++) {
      await request(app.getHttpServer())
        .post('/api/tasks')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ title: `Task Page ${i}` });
    }

    // Phân trang: page 1, limit 2
    const page1Res = await request(app.getHttpServer())
      .get('/api/tasks?page=1&limit=2&sort=title&order=asc')
      .set('Authorization', `Bearer ${user1Token}`);

    expect(page1Res.status).toBe(200);
    expect(page1Res.body.data.length).toBe(2);
    expect(page1Res.body.data[0].title).toBe('Task Page 1');
    expect(page1Res.body.data[1].title).toBe('Task Page 2');
    expect(page1Res.body.meta).toEqual({
      page: 1,
      limit: 2,
      total: 5,
      totalPages: 3,
    });

    // Phân trang: page 3, limit 2 -> 1 task cuối
    const page3Res = await request(app.getHttpServer())
      .get('/api/tasks?page=3&limit=2&sort=title&order=asc')
      .set('Authorization', `Bearer ${user1Token}`);

    expect(page3Res.status).toBe(200);
    expect(page3Res.body.data.length).toBe(1);
    expect(page3Res.body.data[0].title).toBe('Task Page 5');
    expect(page3Res.body.meta).toEqual({
      page: 3,
      limit: 2,
      total: 5,
      totalPages: 3,
    });
  });
});
