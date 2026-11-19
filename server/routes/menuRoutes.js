import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import {
  globalMenuQuerySchema,
  menuItemParamsSchema,
  topMenuQuerySchema,
} from '../validators/restaurantValidators.js';
import { getMenuItem, getTopDishes, searchMenu } from '../controllers/menuController.js';

const router = Router();

router.get('/top', validate({ query: topMenuQuerySchema }), getTopDishes);
router.get('/', validate({ query: globalMenuQuerySchema }), searchMenu);
router.get('/:id', validate({ params: menuItemParamsSchema }), getMenuItem);

export default router;
