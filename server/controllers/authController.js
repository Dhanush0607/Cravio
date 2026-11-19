import { User } from '../models/User.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { clearAuthCookie, setAuthCookie } from '../utils/cookies.js';

function authPayload(user) {
  return {
    user: user.toJSON(),
  };
}

export const register = asyncHandler(async (req, res) => {
  const { name, email, phone, password } = req.body;

  const existingUser = await User.exists({ email });
  if (existingUser) {
    throw ApiError.conflict('An account with this email already exists.');
  }

  // Role is deliberately ignored even if a client sends one.
  const user = await User.create({
    name,
    email,
    phone,
    password,
    role: 'customer',
  });

  setAuthCookie(res, user);

  res.status(201).json({
    success: true,
    message: 'Your Cravio account has been created.',
    data: authPayload(user),
  });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password +tokenVersion');

  if (!user || !(await user.comparePassword(password))) {
    throw ApiError.unauthorized('Email or password is incorrect.');
  }

  if (!user.isActive) {
    throw ApiError.forbidden('This account has been disabled. Please contact support.');
  }

  user.lastLoginAt = new Date();
  await user.save({ validateBeforeSave: false });
  setAuthCookie(res, user);

  res.json({
    success: true,
    message: 'Welcome back to Cravio.',
    data: authPayload(user),
  });
});

export const logout = asyncHandler(async (_req, res) => {
  clearAuthCookie(res);
  res.json({ success: true, message: 'You have been signed out.' });
});

export const getMe = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    data: authPayload(req.user),
  });
});
