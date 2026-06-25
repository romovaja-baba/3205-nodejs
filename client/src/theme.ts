import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#3b82f6',
    },
    success: {
      main: '#22c55e',
    },
    error: {
      main: '#ef4444',
    },
    warning: {
      main: '#f59e0b',
    },
    background: {
      default: '#0f172a',
      paper: '#1e293b',
    },
    text: {
      primary: '#e2e8f0',
      secondary: '#94a3b8',
    },
    divider: '#334155',
  },
  shape: {
    borderRadius: 12,
  },
  typography: {
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    h1: {
      fontSize: '1.5rem',
      fontWeight: 600,
    },
    h2: {
      fontSize: '1rem',
      fontWeight: 600,
    },
    body2: {
      fontSize: '0.8125rem',
    },
    caption: {
      fontSize: '0.75rem',
    },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 600,
          letterSpacing: '0.03em',
        },
        label: {
          textTransform: 'uppercase',
          fontSize: '0.6875rem',
        },
      },
    },
  },
});
