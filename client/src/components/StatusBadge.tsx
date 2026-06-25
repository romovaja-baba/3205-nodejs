import { Chip, type ChipProps } from '@mui/material';
import { JobStatus, UrlStatus } from '../types';

interface Props {
  status: JobStatus | UrlStatus;
}

const STATUS_COLOR: Record<JobStatus | UrlStatus, ChipProps['color']> = {
  success: 'success',
  error: 'error',
  failed: 'error',
  in_progress: 'info',
  pending: 'default',
  cancelled: 'warning',
  completed: 'success',
  completed_with_errors: 'warning',
};

export const StatusBadge = ({ status }: Props) => {
  return (
    <Chip
      label={status}
      color={STATUS_COLOR[status]}
      size="small"
      variant="outlined"
    />
  );
};
