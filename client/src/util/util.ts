export const formatDuration = (ms?: number): string => {
  if (ms === undefined) return '—';
  if (ms < 1000) return `${ms} ms`;
  return `${(ms / 1000).toFixed(2)} s`;
};

export const formatDate = (iso: string): string => {
  return new Date(iso).toLocaleString();
};
