import type { ReactNode } from 'react';
import {
  Alert,
  Box,
  Button,
  LinearProgress,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { cancelActiveJob } from '../store/jobsSlice';
import { usePollJob } from '../hooks/usePollJob';
import { isFinalStatus } from '../types';
import { StatusBadge } from './StatusBadge';
import { formatDuration } from '../util/util';
import { MONO_FONT, ellipsisSx } from '../util/styles';

const DetailsShell = ({ children }: { children: ReactNode }) => {
  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h2" gutterBottom>
        Details
      </Typography>
      {children}
    </Paper>
  );
};

export const JobDetails = () => {
  const dispatch = useAppDispatch();
  const {
    activeJobId,
    details,
    detailsLoading,
    detailsError,
    cancelling,
    cancelError,
  } = useAppSelector((s) => s.jobs);

  usePollJob();

  if (!activeJobId) {
    return (
      <DetailsShell>
        <Typography variant="body2" color="text.secondary">
          Select a job or start a new check.
        </Typography>
      </DetailsShell>
    );
  }

  if (!details) {
    return (
      <DetailsShell>
        {detailsError ? (
          <Alert severity="error">{detailsError}</Alert>
        ) : (
          <Typography variant="body2" color="text.secondary">
            {detailsLoading ? 'Loading…' : 'No data'}
          </Typography>
        )}
      </DetailsShell>
    );
  }

  const { stats } = details;
  const canCancel = !isFinalStatus(details.status);
  const progress = stats.total ? (stats.processed / stats.total) * 100 : 0;

  return (
    <Paper sx={{ p: 2 }}>
      <Stack
        direction="row"
        sx={{
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          mb: 2,
        }}
      >
        <Box>
          <Typography variant="h2">Details</Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            title={details.id}
            sx={{ fontFamily: MONO_FONT }}
          >
            {details.id}
          </Typography>
        </Box>
        <StatusBadge status={details.status} />
      </Stack>

      <Stack direction="row" spacing={1.75} sx={{ mb: 1.25 }}>
        <Typography variant="body2">
          {stats.processed} of {stats.total} processed
        </Typography>
        <Typography variant="body2" color="success.main">
          {stats.success} ok
        </Typography>
        <Typography variant="body2" color="error.main">
          {stats.error} err
        </Typography>
        {stats.cancelled > 0 && (
          <Typography variant="body2" color="text.secondary">
            {stats.cancelled} cancelled
          </Typography>
        )}
      </Stack>

      <LinearProgress
        variant="determinate"
        value={progress}
        sx={{ mb: 1.5, borderRadius: 999, height: 8 }}
      />

      {cancelError && (
        <Alert severity="error" sx={{ mb: 1.5 }}>
          {cancelError}
        </Alert>
      )}

      <Button
        variant="contained"
        color="error"
        disabled={!canCancel || cancelling}
        onClick={() => dispatch(cancelActiveJob(details.id))}
        sx={{ mb: 2 }}
      >
        {cancelling ? 'Cancelling…' : 'Cancel job'}
      </Button>

      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>URL</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>HTTP</TableCell>
              <TableCell>Duration</TableCell>
              <TableCell>Error</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {details.urls.map((u, i) => (
              <TableRow key={`${u.url}-${i}`} hover>
                <TableCell
                  title={u.url}
                  sx={{
                    ...ellipsisSx,
                    maxWidth: 280,
                    fontFamily: MONO_FONT,
                    fontSize: '0.8125rem',
                  }}
                >
                  {u.url}
                </TableCell>
                <TableCell>
                  <StatusBadge status={u.status} />
                </TableCell>
                <TableCell>{u.httpStatus ?? '—'}</TableCell>
                <TableCell>{formatDuration(u.durationMs)}</TableCell>
                <TableCell
                  title={u.error}
                  sx={{ ...ellipsisSx, maxWidth: 220, color: 'error.main' }}
                >
                  {u.error ?? '—'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
};
