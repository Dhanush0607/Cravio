import { Router } from 'express';
import { protect, requireAdmin } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { imageUpload } from '../services/uploadService.js';
import {
  adminListQuerySchema,
  adminMenuQuerySchema,
  customerParamsSchema,
  customerStatusSchema,
} from '../validators/adminValidators.js';
import {
  createMenuItemSchema,
  createRestaurantSchema,
  menuItemParamsSchema,
  restaurantIdParamsSchema,
  updateMenuItemSchema,
  updateRestaurantSchema,
} from '../validators/restaurantValidators.js';
import {
  adminOrderListQuerySchema,
  couponParamsSchema,
  createCouponSchema,
  orderIdParamsSchema,
  updateCouponSchema,
  updateOrderStatusSchema,
} from '../validators/orderValidators.js';
import {
  createCoupon,
  createMenuItem,
  createRestaurant,
  deactivateCoupon,
  deactivateRestaurant,
  deleteMenuItem,
  getDashboard,
  listCoupons,
  listCustomers,
  listMenuItems,
  listOrders,
  listRestaurants,
  updateCoupon,
  updateCustomerStatus,
  updateMenuItem,
  updateRestaurant,
  uploadImage,
} from '../controllers/adminController.js';
import { adminUpdateOrderStatus } from '../controllers/orderController.js';

const router = Router();

router.use(protect, requireAdmin);

router.get('/dashboard', getDashboard);

router.get('/restaurants', validate({ query: adminListQuerySchema }), listRestaurants);
router.post('/restaurants', validate({ body: createRestaurantSchema }), createRestaurant);
router.put(
  '/restaurants/:id',
  validate({ params: restaurantIdParamsSchema, body: updateRestaurantSchema }),
  updateRestaurant
);
router.delete(
  '/restaurants/:id',
  validate({ params: restaurantIdParamsSchema }),
  deactivateRestaurant
);

router.get('/menu', validate({ query: adminMenuQuerySchema }), listMenuItems);
router.post('/menu', validate({ body: createMenuItemSchema }), createMenuItem);
router.put(
  '/menu/:id',
  validate({ params: menuItemParamsSchema, body: updateMenuItemSchema }),
  updateMenuItem
);
router.delete('/menu/:id', validate({ params: menuItemParamsSchema }), deleteMenuItem);

router.get('/orders', validate({ query: adminOrderListQuerySchema }), listOrders);
router.put(
  '/orders/:id/status',
  validate({ params: orderIdParamsSchema, body: updateOrderStatusSchema }),
  adminUpdateOrderStatus
);

router.get('/customers', validate({ query: adminListQuerySchema }), listCustomers);
router.put(
  '/customers/:id/status',
  validate({ params: customerParamsSchema, body: customerStatusSchema }),
  updateCustomerStatus
);

router.get('/coupons', validate({ query: adminListQuerySchema }), listCoupons);
router.post('/coupons', validate({ body: createCouponSchema }), createCoupon);
router.put(
  '/coupons/:id',
  validate({ params: couponParamsSchema, body: updateCouponSchema }),
  updateCoupon
);
router.delete('/coupons/:id', validate({ params: couponParamsSchema }), deactivateCoupon);

router.post('/uploads', imageUpload.single('image'), uploadImage);

export default router;
