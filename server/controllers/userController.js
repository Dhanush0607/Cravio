import { User } from '../models/User.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { setAuthCookie } from '../utils/cookies.js';

function addressList(user) {
  return user.addresses.map((address) => address.toObject());
}

export const getProfile = asyncHandler(async (req, res) => {
  res.json({ success: true, data: { user: req.user.toJSON() } });
});

export const updateProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) {
    throw ApiError.notFound('Account not found.');
  }

  if (req.body.name !== undefined) user.name = req.body.name;
  if (req.body.phone !== undefined) user.phone = req.body.phone;

  await user.save();

  res.json({
    success: true,
    message: 'Profile updated.',
    data: { user: user.toJSON() },
  });
});

export const changePassword = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('+password +tokenVersion');
  if (!user) {
    throw ApiError.notFound('Account not found.');
  }

  const matches = await user.comparePassword(req.body.currentPassword);
  if (!matches) {
    throw ApiError.badRequest('Your current password is incorrect.', [
      { field: 'currentPassword', message: 'Current password is incorrect' },
    ]);
  }

  user.password = req.body.newPassword;
  user.tokenVersion += 1;
  await user.save();
  setAuthCookie(res, user);

  res.json({
    success: true,
    message: 'Password changed. Other sessions have been signed out.',
  });
});

export const getAddresses = asyncHandler(async (req, res) => {
  res.json({ success: true, data: { addresses: addressList(req.user) } });
});

export const addAddress = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) {
    throw ApiError.notFound('Account not found.');
  }

  if (user.addresses.length >= 9) {
    throw ApiError.badRequest('You can save up to 9 addresses.');
  }

  const shouldBecomeDefault = user.addresses.length === 0 || req.body.isDefault;
  if (shouldBecomeDefault) {
    user.addresses.forEach((address) => {
      address.isDefault = false;
    });
  }

  user.addresses.push({
    ...req.body,
    isDefault: shouldBecomeDefault,
  });

  await user.save();

  res.status(201).json({
    success: true,
    message: 'Address saved.',
    data: { addresses: addressList(user) },
  });
});

export const updateAddress = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) {
    throw ApiError.notFound('Account not found.');
  }

  const address = user.addresses.id(req.params.addressId);
  if (!address) {
    throw ApiError.notFound('Address not found.');
  }

  if (req.body.isDefault === true) {
    user.addresses.forEach((item) => {
      item.isDefault = false;
    });
  }

  Object.assign(address, req.body);
  await user.save();

  res.json({
    success: true,
    message: 'Address updated.',
    data: { addresses: addressList(user) },
  });
});

export const deleteAddress = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) {
    throw ApiError.notFound('Account not found.');
  }

  const address = user.addresses.id(req.params.addressId);
  if (!address) {
    throw ApiError.notFound('Address not found.');
  }

  const wasDefault = address.isDefault;
  address.deleteOne();

  if (wasDefault && user.addresses.length > 0) {
    user.addresses[0].isDefault = true;
  }

  await user.save();

  res.json({
    success: true,
    message: 'Address removed.',
    data: { addresses: addressList(user) },
  });
});
