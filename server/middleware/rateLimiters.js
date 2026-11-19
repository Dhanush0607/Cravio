import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';

const standardOptions = {
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skip: () => env.isTest,
  message: {
    success: false,
    message: 'Too many requests. Please wait a moment and try again.',
  },
};

export const globalLimiter = rateLimit({
  ...standardOptions,
  windowMs: 15 * 60 * 1000,
  limit: 600,
});

export const authLimiter = rateLimit({
  ...standardOptions,
  windowMs: 15 * 60 * 1000,
  limit: 25,
});
