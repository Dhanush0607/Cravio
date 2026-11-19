import { Router } from 'express';
import { optionalAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { assistantLimiter } from '../middleware/rateLimiters.js';
import { assistantChatSchema } from '../validators/assistantValidators.js';
import { sendMessage } from '../controllers/assistantController.js';

const router = Router();

router.post(
  '/chat',
  assistantLimiter,
  optionalAuth,
  validate({ body: assistantChatSchema }),
  sendMessage
);

export default router;
