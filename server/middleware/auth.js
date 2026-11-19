import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { AUTH_COOKIE } from '../utils/cookies.js';

function extractToken(req) {
  if (req.cookies?.[AUTH_COOKIE]) {
    return req.cookies[AUTH_COOKIE];
  }

  const authorization = req.get('authorization');
  if (authorization?.startsWith('Bearer ')) {
    return authorization.slice(7);
  }

  return null;
}

async function resolveUser(req) {
  const token = extractToken(req);
  if (!token) {
    return null;
  }

  let payload;
  try {
    payload = jwt.verify(token, env.JWT_SECRET);
  } catch {
    return null;
  }

  const user = await User.findById(payload.sub).select('+tokenVersion');
  if (!user || !user.isActive || user.tokenVersion !== payload.tv) {
    return null;
  }

  return user;
}

export async function protect(req, _res, next) {
  try {
    const user = await resolveUser(req);
    if (!user) {
      throw ApiError.unauthorized('Your session is invalid or has expired. Please sign in again.');
    }
    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
}

export async function optionalAuth(req, _res, next) {
  try {
    req.user = await resolveUser(req);
    next();
  } catch (error) {
    next(error);
  }
}

export function requireAdmin(req, _res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return next(ApiError.forbidden('Administrator access is required.'));
  }
  return next();
}
