import { JobDetails, JobSummary } from '../types';

const BASE_URL = '/api/jobs';

const handleResponse = async <T>(response: Response): Promise<T> => {
  if (response.ok) {
    return (await response.json()) as T;
  }

  const message = await response
    .json()
    .then((data) => data?.error as string | undefined)
    .catch(() => undefined);

  throw new Error(message ?? `Request failed with status ${response.status}`);
};

export const createJob = async (urls: string[]): Promise<{ jobId: string }> => {
  const response = await fetch(BASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ urls }),
  });
  return handleResponse<{ jobId: string }>(response);
};

export const getJobs = async (): Promise<JobSummary[]> => {
  const response = await fetch(BASE_URL);
  return handleResponse<JobSummary[]>(response);
};

export const getJob = async (
  id: string,
  signal?: AbortSignal,
): Promise<JobDetails> => {
  const response = await fetch(`${BASE_URL}/${id}`, { signal });
  return handleResponse<JobDetails>(response);
};

export const cancelJob = async (id: string): Promise<JobDetails> => {
  const response = await fetch(`${BASE_URL}/${id}`, { method: 'DELETE' });
  return handleResponse<JobDetails>(response);
};
