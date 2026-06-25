import { createApp } from './app';
import { cleanupJobs } from './store/jobStore';

const PORT = Number(process.env.PORT) || 4000;

const app = createApp();

const server = app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});

const cleanupInterval = setInterval(() => cleanupJobs(), 5 * 60 * 1000);
cleanupInterval.unref();

const shutdown = (signal: string) => {
  console.log(`Received ${signal}, shutting down gracefully...`);
  clearInterval(cleanupInterval);
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10_000).unref();
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
