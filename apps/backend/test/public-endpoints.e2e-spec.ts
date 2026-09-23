import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';

/**
 * Smoke e2e for public read endpoints added across phases:
 * membership plans, public CMS pages, faceted full-text search, RSS feed.
 * Requires Postgres + Redis reachable; seed for richer assertions.
 */
describe('Public endpoints (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app?.close();
  });

  it('GET /api/subscriptions/plans returns the plan catalogue', async () => {
    const res = await request(app.getHttpServer()).get('/api/subscriptions/plans');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('GET /api/search/photos runs the full-text query path', async () => {
    const res = await request(app.getHttpServer()).get('/api/search/photos?q=test');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('items');
  });

  it('GET /api/seo/rss.xml returns raw RSS XML (not the JSON envelope)', async () => {
    const res = await request(app.getHttpServer()).get('/api/seo/rss.xml');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('application/rss+xml');
    expect(res.text).toContain('<rss');
  });

  it('rejects an unauthenticated payout-connect request', async () => {
    const res = await request(app.getHttpServer()).get('/api/photographers/me/connect/status');
    expect(res.status).toBe(401);
  });
});
