import type { SxProps, Theme } from '@mui/material/styles';

export const MONO_FONT = 'ui-monospace, SFMono-Regular, Menlo, monospace';

export const ellipsisSx: SxProps<Theme> = {
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};
