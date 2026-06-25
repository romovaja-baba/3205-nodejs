import express, { NextFunction, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import jobsRouter from './routes/jobs';

export const createApp = () => {
  const app = express();

  app.use(helmet());

  const allowedOrigins = process.env.CORS_ORIGIN?.split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  app.use(
    cors(
      allowedOrigins && allowedOrigins.length > 0
        ? { origin: allowedOrigins }
        : undefined,
    ),
  );

  app.use(express.json({ limit: '256kb' }));

  app.get('/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok' });
  });

  app.use('/api/jobs', jobsRouter);

  app.use((_req: Request, res: Response) => {
    res.status(404).json({ error: 'Not found' });
  });

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  });

  return app;
};
