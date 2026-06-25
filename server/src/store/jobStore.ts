import { v4 as uuidv4 } from 'uuid';
import { Job, JobDetails, JobStats, JobSummary, UrlResult } from '../types';

interface JobRecord {
  job: Job;
  cancelled: boolean;
  controller: AbortController;
  finishedAt?: number;
}

const jobs = new Map<string, JobRecord>();

const computeStats = (urls: UrlResult[]): JobStats => {
  const stats: JobStats = {
    total: urls.length,
    success: 0,
    error: 0,
    pending: 0,
    inProgress: 0,
    cancelled: 0,
    processed: 0,
  };

  for (const u of urls) {
    switch (u.status) {
      case 'success':
        stats.success += 1;
        break;
      case 'error':
        stats.error += 1;
        break;
      case 'pending':
        stats.pending += 1;
        break;
      case 'in_progress':
        stats.inProgress += 1;
        break;
      case 'cancelled':
        stats.cancelled += 1;
        break;
    }
  }

  stats.processed = stats.success + stats.error + stats.cancelled;
  return stats;
};

const toSummary = (job: Job): JobSummary => {
  return {
    id: job.id,
    createdAt: job.createdAt,
    status: job.status,
    urlCount: job.urls.length,
    stats: computeStats(job.urls),
  };
};

export const createJob = (urls: string[]): Job => {
  const job: Job = {
    id: uuidv4(),
    createdAt: new Date().toISOString(),
    status: 'pending',
    urls: urls.map((url) => ({ url, status: 'pending' })),
  };
  jobs.set(job.id, {
    job,
    cancelled: false,
    controller: new AbortController(),
  });
  return job;
};

export const getJob = (id: string): Job | undefined => {
  return jobs.get(id)?.job;
};

export const getController = (id: string): AbortController | undefined => {
  return jobs.get(id)?.controller;
};

export const clearAllJobs = () => {
  jobs.clear();
};

export const getAllSummaries = (): JobSummary[] => {
  return Array.from(jobs.values())
    .map((record) => toSummary(record.job))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
};

export const getJobDetails = (id: string): JobDetails | undefined => {
  const job = getJob(id);
  if (!job) return undefined;
  return {
    ...toSummary(job),
    urls: job.urls,
  };
};

export const isCancelled = (id: string) => {
  return jobs.get(id)?.cancelled ?? true;
};

export const markCancelled = (id: string): Job | undefined => {
  const record = jobs.get(id);
  if (!record) return undefined;
  record.cancelled = true;
  record.controller.abort();
  return record.job;
};

export const markFinished = (id: string) => {
  const record = jobs.get(id);
  if (record) record.finishedAt = Date.now();
};

const COMPLETED_JOB_TTL_MS = 60 * 60 * 1000;
const MAX_JOBS = 500;

export const cleanupJobs = (now: number = Date.now()) => {
  for (const [id, record] of jobs) {
    if (record.finishedAt && now - record.finishedAt > COMPLETED_JOB_TTL_MS) {
      jobs.delete(id);
    }
  }

  if (jobs.size <= MAX_JOBS) return;

  const finished = Array.from(jobs.entries())
    .filter(([, record]) => record.finishedAt !== undefined)
    .sort((a, b) => (a[1].finishedAt ?? 0) - (b[1].finishedAt ?? 0));

  for (const [id] of finished) {
    if (jobs.size <= MAX_JOBS) break;
    jobs.delete(id);
  }
};
