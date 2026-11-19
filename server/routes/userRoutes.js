import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  addressParamsSchema,
  addressSchema,
  changePasswordSchema,
  updateAddressSchema,
  updateProfileSchema,
} from '../validators/authValidators.js';
import {
  addAddress,
  changePassword,
  deleteAddress,
  getAddresses,
  getProfile,
  updateAddress,
  updateProfile,
} from '../controllers/userController.js';

const router = Router();

router.use(protect);

router.get('/profile', getProfile);
router.put('/profile', validate({ body: updateProfileSchema }), updateProfile);
router.put('/password', validate({ body: changePasswordSchema }), changePassword);

router.get('/addresses', getAddresses);
router.post('/addresses', validate({ body: addressSchema }), addAddress);
router.put(
  '/addresses/:addressId',
  validate({ params: addressParamsSchema, body: updateAddressSchema }),
  updateAddress
);
router.delete('/addresses/:addressId', validate({ params: addressParamsSchema }), deleteAddress);

export default router;
