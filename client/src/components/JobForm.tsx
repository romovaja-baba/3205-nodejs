import { FormEvent, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Paper,
  TextField,
  Typography,
} from '@mui/material';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchJobs, submitJob } from '../store/jobsSlice';

export const JobForm = () => {
  const dispatch = useAppDispatch();
  const creating = useAppSelector((s) => s.jobs.creating);
  const createError = useAppSelector((s) => s.jobs.createError);
  const [text, setText] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const urls = text
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    if (urls.length === 0) return;

    const result = await dispatch(submitJob(urls));
    if (submitJob.fulfilled.match(result)) {
      setText('');
      dispatch(fetchJobs());
    }
  };

  return (
    <Paper component="form" onSubmit={handleSubmit} sx={{ p: 2 }}>
      <Typography variant="h2" gutterBottom>
        New check
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
        One URL per line
      </Typography>
      <TextField
        fullWidth
        multiline
        minRows={8}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={'https://example.com\nhttps://google.com'}
        disabled={creating}
        slotProps={{
          input: {
            sx: {
              fontFamily: 'ui-monospace, monospace',
              fontSize: '0.8125rem',
            },
          },
        }}
      />
      {createError && (
        <Alert severity="error" sx={{ mt: 1.5 }}>
          {createError}
        </Alert>
      )}
      <Box sx={{ mt: 1.5 }}>
        <Button
          type="submit"
          variant="contained"
          disabled={creating || text.trim().length === 0}
        >
          {creating ? 'Starting…' : 'Run check'}
        </Button>
      </Box>
    </Paper>
  );
};
