import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import * as api from '../api/jobsApi';
import { JobDetails, JobSummary } from '../types';

interface JobsState {
  list: JobSummary[];
  listLoading: boolean;
  listError: string | null;

  activeJobId: string | null;
  details: JobDetails | null;
  detailsLoading: boolean;
  detailsError: string | null;

  creating: boolean;
  createError: string | null;

  cancelling: boolean;
  cancelError: string | null;
}

const initialState: JobsState = {
  list: [],
  listLoading: false,
  listError: null,

  activeJobId: null,
  details: null,
  detailsLoading: false,
  detailsError: null,

  creating: false,
  createError: null,

  cancelling: false,
  cancelError: null,
};

export const fetchJobs = createAsyncThunk('jobs/fetchJobs', async () => {
  return api.getJobs();
});

export const submitJob = createAsyncThunk(
  'jobs/submitJob',
  async (urls: string[]) => {
    const { jobId } = await api.createJob(urls);
    return jobId;
  },
);

export const fetchJobDetails = createAsyncThunk(
  'jobs/fetchJobDetails',
  async (jobId: string, { signal }) => {
    const details = await api.getJob(jobId, signal);
    return { requestedId: jobId, details };
  },
);

export const cancelActiveJob = createAsyncThunk(
  'jobs/cancelJob',
  async (jobId: string) => {
    return api.cancelJob(jobId);
  },
);

const jobsSlice = createSlice({
  name: 'jobs',
  initialState,
  reducers: {
    setActiveJob(state, action: PayloadAction<string | null>) {
      if (state.activeJobId === action.payload) return;
      state.activeJobId = action.payload;
      state.details = null;
      state.detailsError = null;
      state.detailsLoading = false;
      state.cancelError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchJobs.pending, (state) => {
        state.listLoading = true;
        state.listError = null;
      })
      .addCase(fetchJobs.fulfilled, (state, action) => {
        state.listLoading = false;
        state.list = action.payload;
      })
      .addCase(fetchJobs.rejected, (state, action) => {
        state.listLoading = false;
        state.listError = action.error.message ?? 'Failed to load jobs';
      });

    builder
      .addCase(submitJob.pending, (state) => {
        state.creating = true;
        state.createError = null;
      })
      .addCase(submitJob.fulfilled, (state, action) => {
        state.creating = false;
        const jobId = action.payload;
        state.activeJobId = jobId;
        state.details = null;
        state.detailsError = null;
        state.detailsLoading = false;
      })
      .addCase(submitJob.rejected, (state, action) => {
        state.creating = false;
        state.createError = action.error.message ?? 'Failed to create job';
      });

    builder
      .addCase(fetchJobDetails.pending, (state, action) => {
        if (action.meta.arg === state.activeJobId) {
          state.detailsLoading = true;
          state.detailsError = null;
        }
      })
      .addCase(fetchJobDetails.fulfilled, (state, action) => {
        if (action.payload.requestedId !== state.activeJobId) return;
        state.detailsLoading = false;
        state.details = action.payload.details;
      })
      .addCase(fetchJobDetails.rejected, (state, action) => {
        if (action.meta.arg !== state.activeJobId) return;
        if (action.meta.aborted) return;
        state.detailsLoading = false;
        state.detailsError =
          action.error.message ?? 'Failed to load job details';
      });

    builder
      .addCase(cancelActiveJob.pending, (state) => {
        state.cancelling = true;
        state.cancelError = null;
      })
      .addCase(cancelActiveJob.fulfilled, (state, action) => {
        state.cancelling = false;
        if (action.payload.id === state.activeJobId) {
          state.details = action.payload;
        }
      })
      .addCase(cancelActiveJob.rejected, (state, action) => {
        state.cancelling = false;
        state.cancelError = action.error.message ?? 'Failed to cancel job';
      });
  },
});

export const { setActiveJob } = jobsSlice.actions;
export default jobsSlice.reducer;
