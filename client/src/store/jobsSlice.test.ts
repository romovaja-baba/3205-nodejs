import { describe, expect, it } from 'vitest';
import reducer, { fetchJobDetails, setActiveJob } from './jobsSlice';
import type { JobDetails } from '../types';

const makeDetails = (id: string): JobDetails => {
  return {
    id,
    createdAt: new Date().toISOString(),
    status: 'in_progress',
    urlCount: 1,
    stats: {
      total: 1,
      success: 0,
      error: 0,
      pending: 1,
      inProgress: 0,
      cancelled: 0,
      processed: 0,
    },
    urls: [{ url: 'https://a.test', status: 'pending' }],
  };
};

const initial = reducer(undefined, { type: '@@INIT' });

describe('jobsSlice details race handling', () => {
  it('applies details for the active job', () => {
    const active = reducer(initial, setActiveJob('job-1'));
    const details = makeDetails('job-1');

    const next = reducer(
      active,
      fetchJobDetails.fulfilled(
        { requestedId: 'job-1', details },
        'req-1',
        'job-1',
      ),
    );

    expect(next.details?.id).toBe('job-1');
  });

  it('ignores details from a job that is no longer active', () => {
    const active = reducer(initial, setActiveJob('job-2'));
    const staleDetails = makeDetails('job-1');

    const next = reducer(
      active,
      fetchJobDetails.fulfilled(
        { requestedId: 'job-1', details: staleDetails },
        'req-1',
        'job-1',
      ),
    );

    expect(next.details).toBeNull();
  });

  it('resets details when switching the active job', () => {
    const active = reducer(initial, setActiveJob('job-1'));
    const withDetails = reducer(
      active,
      fetchJobDetails.fulfilled(
        { requestedId: 'job-1', details: makeDetails('job-1') },
        'req-1',
        'job-1',
      ),
    );
    expect(withDetails.details).not.toBeNull();

    const switched = reducer(withDetails, setActiveJob('job-2'));
    expect(switched.details).toBeNull();
    expect(switched.activeJobId).toBe('job-2');
  });
});
