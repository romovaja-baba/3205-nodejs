import { Router, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import {
  createJob,
  getAllSummaries,
  getJob,
  getJobDetails,
  markCancelled,
} from '../store/jobStore';
import {
  finalizeCancellation,
  startJobProcessing,
} from '../services/jobProcessor';

const router = Router();

const MAX_URLS_PER_JOB = 1000;

const isValidUrl = (value: string) => {
  if (!URL.canParse(value)) return false;
  const parsed = new URL(value);
  return parsed.protocol === 'http:' || parsed.protocol === 'https:';
};

const createJobLimiter = rateLimit({
  windowMs: 60_000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many jobs created, please try again later' },
});

router.post('/', createJobLimiter, (req: Request, res: Response) => {
  const { urls } = req.body ?? {};

  if (!Array.isArray(urls)) {
    return res
      .status(400)
      .json({ error: 'Field "urls" must be an array of strings' });
  }

  const cleaned = urls
    .filter((u): u is string => typeof u === 'string')
    .map((u) => u.trim())
    .filter((u) => u.length > 0);

  if (cleaned.length === 0) {
    return res.status(400).json({ error: 'No URLs provided' });
  }

  if (cleaned.length > MAX_URLS_PER_JOB) {
    return res.status(400).json({
      error: `Too many URLs: ${cleaned.length} (max ${MAX_URLS_PER_JOB})`,
    });
  }

  const invalid = cleaned.filter((u) => !isValidUrl(u));
  if (invalid.length > 0) {
    return res.status(400).json({ error: 'Some URLs are invalid', invalid });
  }

  const job = createJob(cleaned);
  startJobProcessing(job.id);

  return res.status(201).json({ jobId: job.id });
});

router.get('/', (_req: Request, res: Response) => {
  return res.json(getAllSummaries());
});

router.get('/:id', (req: Request, res: Response) => {
  const details = getJobDetails(req.params.id);
  if (!details) {
    return res.status(404).json({ error: 'Job not found' });
  }
  return res.json(details);
});

router.delete('/:id', (req: Request, res: Response) => {
  const job = getJob(req.params.id);
  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }

  if (
    ['completed', 'cancelled', 'completed_with_errors'].includes(job.status)
  ) {
    return res.status(409).json({
      error: `Job is already ${job.status}`,
    });
  }

  markCancelled(job.id);
  finalizeCancellation(job.id);

  const details = getJobDetails(job.id);
  return res.json(details);
});

export default router;
