import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export const AUTH_COOKIE = 'cravio_token';
const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;

function baseCookieOptions() {
  return {
    secure: env.cookieSecure,
    sameSite: env.cookieSecure ? 'none' : 'lax',
    path: '/',
  };
}

export function createToken(user) {
  return jwt.sign(
    {
      sub: user._id.toString(),
      role: user.role,
      tv: user.tokenVersion,
    },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN }
  );
}

export function setAuthCookie(res, user) {
  res.cookie(AUTH_COOKIE, createToken(user), {
    ...baseCookieOptions(),
    httpOnly: true,
    maxAge: SEVEN_DAYS,
  });
}

export function clearAuthCookie(res) {
  res.clearCookie(AUTH_COOKIE, {
    ...baseCookieOptions(),
    httpOnly: true,
  });
}

export function publicCookieOptions() {
  return {
    ...baseCookieOptions(),
    httpOnly: false,
    maxAge: SEVEN_DAYS,
  };
}
