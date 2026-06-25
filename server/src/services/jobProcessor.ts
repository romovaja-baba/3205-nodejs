import {
  getController,
  getJob,
  isCancelled,
  markFinished,
} from '../store/jobStore';
import { Job, UrlResult } from '../types';

const MAX_CONCURRENCY = 5;
const DEFAULT_MAX_ARTIFICIAL_DELAY_MS = 10_000;
const REQUEST_TIMEOUT_MS = 15_000;

const maxArtificialDelayMs = (): number => {
  const raw = process.env.MAX_ARTIFICIAL_DELAY_MS;
  if (raw === undefined) return DEFAULT_MAX_ARTIFICIAL_DELAY_MS;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed >= 0
    ? parsed
    : DEFAULT_MAX_ARTIFICIAL_DELAY_MS;
};

const delay = (ms: number, signal: AbortSignal): Promise<void> => {
  if (signal.aborted) return Promise.resolve();
  return new Promise((resolve) => {
    const onAbort = () => {
      clearTimeout(timer);
      resolve();
    };
    const timer = setTimeout(() => {
      signal.removeEventListener('abort', onAbort);
      resolve();
    }, ms);
    signal.addEventListener('abort', onAbort, { once: true });
  });
};

const randomDelayMs = (): number => {
  return Math.floor(Math.random() * (maxArtificialDelayMs() + 1));
};

const headOrGet = async (
  url: string,
  signal: AbortSignal,
): Promise<Response> => {
  const response = await fetch(url, {
    method: 'HEAD',
    signal,
    redirect: 'follow',
  });
  if (response.status === 405 || response.status === 501) {
    return fetch(url, { method: 'GET', signal, redirect: 'follow' });
  }
  return response;
};

interface UrlCheck {
  httpStatus?: number;
  error?: string;
}

const requestUrl = async (
  url: string,
  jobSignal: AbortSignal,
): Promise<UrlCheck> => {
  const signal = AbortSignal.any([
    jobSignal,
    AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  ]);

  try {
    const response = await headOrGet(url, signal);
    return {
      httpStatus: response.status,
      error: response.ok
        ? undefined
        : `HTTP ${response.status} ${response.statusText}`.trim(),
    };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : 'Unknown request error',
    };
  }
};

const checkUrl = async (
  item: UrlResult,
  jobId: string,
  jobSignal: AbortSignal,
): Promise<void> => {
  const start = Date.now();
  item.status = 'in_progress';
  item.startedAt = new Date(start).toISOString();

  const { httpStatus, error } = await requestUrl(item.url, jobSignal);
  await delay(randomDelayMs(), jobSignal);

  item.finishedAt = new Date().toISOString();
  item.durationMs = Date.now() - start;

  if (isCancelled(jobId)) {
    item.status = 'cancelled';
    return;
  }

  item.httpStatus = httpStatus;
  item.status = error ? 'error' : 'success';
  if (error) item.error = error;
};

const worker = async (
  job: Job,
  queue: UrlResult[],
  jobSignal: AbortSignal,
): Promise<void> => {
  while (queue.length > 0) {
    if (isCancelled(job.id)) return;
    const item = queue.shift();
    if (!item) return;
    await checkUrl(item, job.id, jobSignal);
  }
};

export const startJobProcessing = (jobId: string) => {
  void runJob(jobId);
};

const runJob = async (jobId: string): Promise<void> => {
  const job = getJob(jobId);
  const controller = getController(jobId);
  if (!job || !controller) return;

  job.status = 'in_progress';

  const queue = [...job.urls];
  const workerCount = Math.min(MAX_CONCURRENCY, queue.length);

  try {
    await Promise.all(
      Array.from({ length: workerCount }, () =>
        worker(job, queue, controller.signal),
      ),
    );
  } catch (err) {
    if (!isCancelled(job.id)) {
      console.error(`Job ${job.id} failed:`, err);
      job.status = 'failed';
      markFinished(job.id);
      return;
    }
  }

  if (isCancelled(job.id)) {
    finalizeCancellation(job.id);
    return;
  }

  const hasErrors = job.urls.some((item) => item.status === 'error');
  job.status = hasErrors ? 'completed_with_errors' : 'completed';
  markFinished(job.id);
};

export const finalizeCancellation = (jobId: string) => {
  const job = getJob(jobId);
  if (!job) return;
  for (const item of job.urls) {
    if (item.status === 'pending' || item.status === 'in_progress') {
      item.status = 'cancelled';
      item.finishedAt = item.finishedAt ?? new Date().toISOString();
    }
  }
  const hasErrors = job.urls.some((url) => url.status === 'error');
  job.status = hasErrors ? 'completed_with_errors' : 'cancelled';
  markFinished(job.id);
};
