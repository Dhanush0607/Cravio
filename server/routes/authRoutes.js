import { Router } from 'express';
import { csrfTokenHandler } from '../middleware/csrf.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { authLimiter } from '../middleware/rateLimiters.js';
import { loginSchema, registerSchema } from '../validators/authValidators.js';
import { getMe, login, logout, register } from '../controllers/authController.js';

const router = Router();

router.get('/csrf', csrfTokenHandler);
router.post('/register', authLimiter, validate({ body: registerSchema }), register);
router.post('/login', authLimiter, validate({ body: loginSchema }), login);
router.post('/logout', logout);
router.get('/me', protect, getMe);

export default router;
