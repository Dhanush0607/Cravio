import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { validateCouponSchema } from '../validators/orderValidators.js';
import { featuredCoupons, validateCouponCode } from '../controllers/couponController.js';

const router = Router();

router.get('/featured', featuredCoupons);
router.post('/validate', protect, validate({ body: validateCouponSchema }), validateCouponCode);

export default router;
