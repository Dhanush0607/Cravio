import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import {
  menuQuerySchema,
  restaurantIdParamsSchema,
  restaurantListQuerySchema,
  restaurantParamsSchema,
} from '../validators/restaurantValidators.js';
import {
  getCuisines,
  getRestaurant,
  getRestaurantMenu,
  listRestaurants,
} from '../controllers/restaurantController.js';

const router = Router();

router.get('/', validate({ query: restaurantListQuerySchema }), listRestaurants);
router.get('/cuisines', getCuisines);
router.get(
  '/:id/menu',
  validate({ params: restaurantIdParamsSchema, query: menuQuerySchema }),
  getRestaurantMenu
);
router.get('/:identifier', validate({ params: restaurantParamsSchema }), getRestaurant);

export default router;
