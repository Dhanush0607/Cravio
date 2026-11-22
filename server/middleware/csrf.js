import crypto from 'node:crypto';
import { env } from '../config/env.js';
import { AUTH_COOKIE, publicCookieOptions } from '../utils/cookies.js';
import { ApiError } from '../utils/ApiError.js';

export const CSRF_COOKIE = 'cravio_csrf';
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

export function ensureCsrfCookie(req, res, next) {
  let token = req.cookies?.[CSRF_COOKIE];

  if (!token) {
    token = crypto.randomBytes(32).toString('hex');
    res.cookie(CSRF_COOKIE, token, publicCookieOptions());
  }

  req.csrfToken = token;
  res.locals.csrfToken = token;
  next();
}

export function verifyCsrf(req, _res, next) {
  if (SAFE_METHODS.has(req.method)) {
    return next();
  }

  // Credential-free requests cannot perform authenticated state changes.
  if (!req.cookies?.[AUTH_COOKIE]) {
    return next();
  }

  const cookieToken = req.cookies?.[CSRF_COOKIE];
  const headerToken = req.get('x-csrf-token');
  if (!cookieToken || !headerToken) {
    return next(new ApiError(403, 'Missing CSRF token. Refresh the page and try again.'));
  }

  const cookieBuffer = Buffer.from(cookieToken);
  const headerBuffer = Buffer.from(headerToken);

  if (
    cookieBuffer.length !== headerBuffer.length ||
    !crypto.timingSafeEqual(cookieBuffer, headerBuffer)
  ) {
    return next(new ApiError(403, 'Invalid CSRF token. Refresh the page and try again.'));
  }

  return next();
}

export function csrfTokenHandler(req, res) {
  res.json({
    success: true,
    data: { csrfToken: req.csrfToken || res.locals.csrfToken },
  });
}

export function corsOptions() {
  return {
    origin(origin, callback) {
      if (!origin || env.clientOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new ApiError(403, 'Origin is not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token', 'X-Idempotency-Key'],
    exposedHeaders: ['X-Request-Id'],
  };
}
