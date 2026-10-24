import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';

describe('CategoriesController (e2e)', () => {
  let app: INestApplication;
  let token: string;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();

    const uniqueEmail = `cat_test_${Date.now()}@example.com`;
    await request(app.getHttpServer()).post('/api/auth/register').send({
      name: 'Category Tester',
      email: uniqueEmail,
      password: 'password123',
    });

    const loginRes = await request(app.getHttpServer()).post('/api/auth/login').send({
      email: uniqueEmail,
      password: 'password123',
    });
    token = loginRes.body.access_token;
  });

  it('/api/categories (GET)', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/categories')
      .set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(200);
  });

  it('/api/categories (POST)', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/categories')
      .set('Authorization', `Bearer ${token}`)
      .send({});
    expect(response.status).toBe(201);
  });

  afterEach(async () => {
    await app.close();
  });
});

