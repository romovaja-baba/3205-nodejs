export type JobStatus =
  | 'pending'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'failed';

export type UrlStatus =
  | 'pending'
  | 'in_progress'
  | 'success'
  | 'error'
  | 'cancelled';

export interface UrlResult {
  url: string;
  status: UrlStatus;
  httpStatus?: number;
  error?: string;
  startedAt?: string;
  finishedAt?: string;
  durationMs?: number;
}

export interface JobStats {
  total: number;
  success: number;
  error: number;
  pending: number;
  inProgress: number;
  cancelled: number;
  processed: number;
}

export interface JobSummary {
  id: string;
  createdAt: string;
  status: JobStatus;
  urlCount: number;
  stats: JobStats;
}

export interface JobDetails extends JobSummary {
  urls: UrlResult[];
}

export const FINAL_JOB_STATUSES: JobStatus[] = [
  'completed',
  'cancelled',
  'failed',
];

export const isFinalStatus = (status: JobStatus): boolean => {
  return FINAL_JOB_STATUSES.includes(status);
};
