import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';

describe('AuthController (e2e)', () => {
  let app: INestApplication;

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
  });

  it('/api/auth/register (POST)', async () => {
    const uniqueEmail = `test_${Date.now()}@example.com`;
    const response = await request(app.getHttpServer()).post('/api/auth/register').send({
      name: 'Test User',
      email: uniqueEmail,
      password: 'password123',
    });
    expect(response.status).toBe(201);
  });

  it('/api/auth/login (POST)', async () => {
    const uniqueEmail = `login_${Date.now()}@example.com`;
    await request(app.getHttpServer()).post('/api/auth/register').send({
      name: 'Login User',
      email: uniqueEmail,
      password: 'password123',
    });

    const response = await request(app.getHttpServer()).post('/api/auth/login').send({
      email: uniqueEmail,
      password: 'password123',
    });
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('access_token');
    expect(response.body.user).toHaveProperty('email', uniqueEmail);
  });

  it('/api/auth/me (GET) - with valid token', async () => {
    const uniqueEmail = `me_${Date.now()}@example.com`;
    await request(app.getHttpServer()).post('/api/auth/register').send({
      name: 'Me User',
      email: uniqueEmail,
      password: 'password123',
    });

    const loginRes = await request(app.getHttpServer()).post('/api/auth/login').send({
      email: uniqueEmail,
      password: 'password123',
    });
    const token = loginRes.body.access_token;

    const meRes = await request(app.getHttpServer())
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(meRes.status).toBe(200);
    expect(meRes.body).toHaveProperty('email', uniqueEmail);
    expect(meRes.body).toHaveProperty('name', 'Me User');
  });

  it('/api/auth/me (GET) - without token returns 401', async () => {
    const response = await request(app.getHttpServer()).get('/api/auth/me');
    expect(response.status).toBe(401);
  });

  afterEach(async () => {
    await app.close();
  });
});


