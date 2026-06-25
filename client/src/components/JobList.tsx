import { useEffect } from 'react';
import {
  Paper,
  Typography,
  Alert,
  List,
  ListItemButton,
  Stack,
} from '@mui/material';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchJobs, setActiveJob } from '../store/jobsSlice';
import { StatusBadge } from './StatusBadge';
import { formatDate } from '../util/util';
import { MONO_FONT } from '../util/styles';

export const JobList = () => {
  const dispatch = useAppDispatch();
  const { list, listLoading, listError, activeJobId } = useAppSelector(
    (s) => s.jobs,
  );

  useEffect(() => {
    dispatch(fetchJobs());
    const id = setInterval(() => dispatch(fetchJobs()), 3000);
    return () => clearInterval(id);
  }, [dispatch]);

  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h2" gutterBottom>
        Jobs
      </Typography>

      {listError && (
        <Alert severity="error" sx={{ mb: 1.5 }}>
          {listError}
        </Alert>
      )}

      {listLoading && list.length === 0 && (
        <Typography variant="body2" color="text.secondary">
          Loading…
        </Typography>
      )}

      {!listLoading && list.length === 0 && (
        <Typography variant="body2" color="text.secondary">
          No jobs yet
        </Typography>
      )}

      <List
        disablePadding
        sx={{
          maxHeight: 420,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
        }}
      >
        {list.map((job) => {
          const selected = job.id === activeJobId;
          return (
            <ListItemButton
              key={job.id}
              selected={selected}
              onClick={() => dispatch(setActiveJob(job.id))}
              sx={{
                flexDirection: 'column',
                alignItems: 'stretch',
                border: 1,
                borderColor: selected ? 'primary.main' : 'divider',
                borderRadius: 2,
                bgcolor: 'background.default',
                '&.Mui-selected': {
                  bgcolor: 'background.default',
                },
              }}
            >
              <Stack
                direction="row"
                sx={{ justifyContent: 'space-between', alignItems: 'center' }}
              >
                <Typography
                  variant="caption"
                  color="text.secondary"
                  title={job.id}
                  sx={{ fontFamily: MONO_FONT }}
                >
                  {job.id.slice(0, 8)}
                </Typography>
                <StatusBadge status={job.status} />
              </Stack>

              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ mt: 0.5 }}
              >
                {formatDate(job.createdAt)}
              </Typography>

              <Stack direction="row" spacing={1.25} sx={{ mt: 0.75 }}>
                <Typography variant="caption">{job.urlCount} urls</Typography>
                <Typography variant="caption" color="success.main">
                  {job.stats.success} ok
                </Typography>
                <Typography variant="caption" color="error.main">
                  {job.stats.error} err
                </Typography>
              </Stack>
            </ListItemButton>
          );
        })}
      </List>
    </Paper>
  );
};
