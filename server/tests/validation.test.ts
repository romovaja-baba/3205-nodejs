import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import { clearAllJobs } from '../src/store/jobStore';

process.env.MAX_ARTIFICIAL_DELAY_MS = '0';

const app = createApp();

beforeAll(() => {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => new Response(null, { status: 200 })),
  );
});

afterEach(() => {
  clearAllJobs();
});

describe('POST /api/jobs validation', () => {
  it('rejects a non-array urls field', async () => {
    const res = await request(app).post('/api/jobs').send({ urls: 'nope' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/must be an array/i);
  });

  it('rejects an empty list', async () => {
    const res = await request(app).post('/api/jobs').send({ urls: [] });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/no urls/i);
  });

  it('rejects invalid URLs and reports them', async () => {
    const res = await request(app)
      .post('/api/jobs')
      .send({ urls: ['not-a-url', 'ftp://x.test', 'https://ok.test'] });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/invalid/i);
    expect(res.body.invalid).toContain('not-a-url');
    expect(res.body.invalid).toContain('ftp://x.test');
  });

  it('rejects more URLs than the per-job limit', async () => {
    const urls = Array.from(
      { length: 1001 },
      (_, i) => `https://example.test/${i}`,
    );
    const res = await request(app).post('/api/jobs').send({ urls });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/too many urls/i);
  });

  it('accepts a valid list and returns a job id', async () => {
    const res = await request(app)
      .post('/api/jobs')
      .send({ urls: ['https://example.test'] });
    expect(res.status).toBe(201);
    expect(typeof res.body.jobId).toBe('string');
  });
});

describe('GET /api/jobs/:id', () => {
  it('returns 404 for an unknown job', async () => {
    const res = await request(app).get('/api/jobs/does-not-exist');
    expect(res.status).toBe(404);
  });
});
