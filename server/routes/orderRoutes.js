import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  cancelOrderSchema,
  myOrdersQuerySchema,
  orderCreateSchema,
  orderIdParamsSchema,
} from '../validators/orderValidators.js';
import {
  cancelOrder,
  createOrder,
  getMyOrders,
  getOrder,
} from '../controllers/orderController.js';

const router = Router();

router.use(protect);

router.post('/', validate({ body: orderCreateSchema }), createOrder);
router.get('/my-orders', validate({ query: myOrdersQuerySchema }), getMyOrders);
router.get('/:id', validate({ params: orderIdParamsSchema }), getOrder);
router.patch(
  '/:id/cancel',
  validate({ params: orderIdParamsSchema, body: cancelOrderSchema }),
  cancelOrder
);

export default router;
