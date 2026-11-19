import { ZodError } from 'zod';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';

export function notFoundHandler(req, _res, next) {
  next(ApiError.notFound(`Route ${req.method} ${req.originalUrl} was not found.`));
}

export function errorHandler(error, req, res, _next) {
  let statusCode = error.statusCode || 500;
  let message = error.message || 'Something went wrong.';
  let details = error.details;

  if (error instanceof ZodError) {
    statusCode = 400;
    message = 'Please correct the highlighted fields.';
    details = error.issues.map((issue) => ({
      field: issue.path.join('.'),
      message: issue.message,
    }));
  } else if (error.name === 'CastError') {
    statusCode = 400;
    message = 'The provided identifier is invalid.';
  } else if (error.name === 'ValidationError') {
    statusCode = 400;
    message = 'Please check the submitted information.';
    details = Object.values(error.errors).map((item) => ({
      field: item.path,
      message: item.message,
    }));
  } else if (error.code === 11000) {
    statusCode = 409;
    const field = Object.keys(error.keyPattern || {})[0] || 'value';
    message = `A record with this ${field} already exists.`;
  } else if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Your session is invalid or has expired.';
  } else if (error.name === 'MulterError') {
    statusCode = 400;
    message =
      error.code === 'LIMIT_FILE_SIZE'
        ? 'Image must be 5 MB or smaller.'
        : 'The image upload could not be completed.';
  } else if (error.type === 'entity.parse.failed') {
    statusCode = 400;
    message = 'The request body contains invalid JSON.';
  }

  if (statusCode >= 500 && !env.isTest) {
    console.error(`[${req.method} ${req.originalUrl}]`, error);
  }

  const payload = {
    success: false,
    message: statusCode >= 500 && env.isProduction ? 'Something went wrong. Please try again.' : message,
  };

  if (details) {
    payload.errors = details;
  }

  if (!env.isProduction && statusCode >= 500) {
    payload.stack = error.stack;
  }

  res.status(statusCode).json(payload);
}
