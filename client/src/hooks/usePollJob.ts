import { useEffect, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchJobDetails } from '../store/jobsSlice';
import { isFinalStatus, JobStatus } from '../types';

export const usePollJob = (intervalMs = 1500) => {
  const dispatch = useAppDispatch();
  const activeJobId = useAppSelector((s) => s.jobs.activeJobId);
  const status = useAppSelector((s) => s.jobs.details?.status);

  const statusRef = useRef<JobStatus | undefined>(status);
  statusRef.current = status;

  useEffect(() => {
    if (!activeJobId) return;

    let inFlight = dispatch(fetchJobDetails(activeJobId));

    const intervalId = setInterval(() => {
      const current = statusRef.current;
      if (current && isFinalStatus(current)) {
        clearInterval(intervalId);
        return;
      }
      inFlight = dispatch(fetchJobDetails(activeJobId));
    }, intervalMs);

    return () => {
      clearInterval(intervalId);
      inFlight.abort();
    };
  }, [activeJobId, dispatch, intervalMs]);
};
