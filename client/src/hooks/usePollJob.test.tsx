import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { renderHook, waitFor } from '@testing-library/react';
import jobsReducer, { setActiveJob } from '../store/jobsSlice';
import type { JobDetails } from '../types';
import { usePollJob } from './usePollJob';
import React from 'react';

const getJob = vi.fn();

vi.mock('../api/jobsApi', () => ({
  getJob: (id: string, signal?: AbortSignal) => getJob(id, signal),
  getJobs: vi.fn(),
  createJob: vi.fn(),
  cancelJob: vi.fn(),
}));

const makeDetails = (status: JobDetails['status']): JobDetails => {
  return {
    id: 'job-1',
    createdAt: new Date().toISOString(),
    status,
    urlCount: 1,
    stats: {
      total: 1,
      success: 1,
      error: 0,
      pending: 0,
      inProgress: 0,
      cancelled: 0,
      processed: 1,
    },
    urls: [{ url: 'https://a.test', status: 'success' }],
  };
};

const makeStore = () => {
  return configureStore({ reducer: { jobs: jobsReducer } });
};

beforeEach(() => {
  getJob.mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('usePollJob', () => {
  it('stops polling once the job reaches a final status', async () => {
    getJob.mockResolvedValue(makeDetails('completed'));

    const store = makeStore();
    store.dispatch(setActiveJob('job-1'));

    const wrapper = ({ children }: { children: ReactNode }) => (
      <Provider store={store}>{children}</Provider>
    );

    renderHook(() => usePollJob(20), { wrapper });

    await waitFor(() => {
      expect(store.getState().jobs.details?.status).toBe('completed');
    });

    const callsAfterFinal = getJob.mock.calls.length;
    await new Promise((r) => setTimeout(r, 120));

    expect(getJob.mock.calls.length).toBe(callsAfterFinal);
  });

  it('keeps polling while the job is in progress', async () => {
    getJob.mockResolvedValue(makeDetails('in_progress'));

    const store = makeStore();
    store.dispatch(setActiveJob('job-1'));

    const wrapper = ({ children }: { children: ReactNode }) => (
      <Provider store={store}>{children}</Provider>
    );

    renderHook(() => usePollJob(20), { wrapper });

    await waitFor(() => {
      expect(getJob.mock.calls.length).toBeGreaterThan(2);
    });
  });
});
