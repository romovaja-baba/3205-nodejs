import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  clearAllJobs,
  createJob,
  getJob,
  markCancelled,
} from '../src/store/jobStore';
import {
  finalizeCancellation,
  startJobProcessing,
} from '../src/services/jobProcessor';
import { JobStatus } from '../src/types';

const FINAL: JobStatus[] = [
  'completed',
  'completed_with_errors',
  'cancelled',
  'failed',
];

const waitForStatus = async (
  jobId: string,
  predicate: (s: JobStatus) => boolean,
  timeoutMs = 5000,
): Promise<void> => {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const job = getJob(jobId);
    if (job && predicate(job.status)) return;
    await new Promise((r) => setTimeout(r, 10));
  }
  throw new Error(`Timed out waiting for job ${jobId} status`);
};

beforeEach(() => {
  process.env.MAX_ARTIFICIAL_DELAY_MS = '0';
});

afterEach(() => {
  clearAllJobs();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('job lifecycle', () => {
  it('processes all URLs and completes', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(null, { status: 200 })),
    );

    const job = createJob(['https://a.test', 'https://b.test']);
    startJobProcessing(job.id);

    await waitForStatus(job.id, (s) => FINAL.includes(s));

    const result = getJob(job.id)!;
    expect(result.status).toBe('completed');
    expect(result.urls.every((u) => u.status === 'success')).toBe(true);
  });

  it('marks job as completed_with_errors when at least one URL fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('boom');
      }),
    );

    const job = createJob(['https://a.test']);
    startJobProcessing(job.id);
    await waitForStatus(job.id, (s) => FINAL.includes(s));

    const result = getJob(job.id)!;
    expect(result.status).toBe('completed_with_errors');
    expect(result.urls[0].status).toBe('error');
    expect(result.urls[0].error).toMatch(/boom/);
  });

  it('falls back to GET when HEAD is not allowed', async () => {
    const fetchMock = vi.fn(async (_url: string, init?: RequestInit) => {
      if (init?.method === 'HEAD') {
        return new Response(null, { status: 405 });
      }
      return new Response(null, { status: 200 });
    });
    vi.stubGlobal('fetch', fetchMock);

    const job = createJob(['https://a.test']);
    startJobProcessing(job.id);
    await waitForStatus(job.id, (s) => FINAL.includes(s));

    const result = getJob(job.id)!;
    expect(result.urls[0].status).toBe('success');
    expect(result.urls[0].httpStatus).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});

describe('cancellation', () => {
  it('marks pending and in-progress URLs as cancelled', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(
        (_url: string, init?: RequestInit) =>
          new Promise<Response>((_resolve, reject) => {
            init?.signal?.addEventListener('abort', () =>
              reject(new Error('aborted')),
            );
          }),
      ),
    );

    const job = createJob([
      'https://a.test',
      'https://b.test',
      'https://c.test',
    ]);
    startJobProcessing(job.id);

    await new Promise((r) => setTimeout(r, 30));

    markCancelled(job.id);
    finalizeCancellation(job.id);

    const result = getJob(job.id)!;
    expect(result.status).toBe('cancelled');
    expect(result.urls.every((u) => u.status === 'cancelled')).toBe(true);
  });
});

describe('concurrency pool', () => {
  it('never exceeds 5 concurrent requests', async () => {
    let inFlight = 0;
    let maxInFlight = 0;
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        inFlight += 1;
        maxInFlight = Math.max(maxInFlight, inFlight);
        await new Promise((r) => setTimeout(r, 20));
        inFlight -= 1;
        return new Response(null, { status: 200 });
      }),
    );

    const urls = Array.from(
      { length: 15 },
      (_, i) => `https://example.test/${i}`,
    );
    const job = createJob(urls);
    startJobProcessing(job.id);
    await waitForStatus(job.id, (s) => FINAL.includes(s));

    expect(maxInFlight).toBeLessThanOrEqual(5);
    expect(maxInFlight).toBeGreaterThan(1);
  });
});
