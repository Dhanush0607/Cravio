import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { paymentCreateSchema, paymentVerifySchema } from '../validators/orderValidators.js';
import {
  createPayment,
  getPaymentConfig,
  verifyPayment,
} from '../controllers/paymentController.js';

const router = Router();

router.get('/config', getPaymentConfig);
router.post('/create', protect, validate({ body: paymentCreateSchema }), createPayment);
router.post('/verify', protect, validate({ body: paymentVerifySchema }), verifyPayment);

export default router;
