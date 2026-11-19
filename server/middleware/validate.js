import { ZodError } from 'zod';
import { ApiError } from '../utils/ApiError.js';

export const validate = (schemas) => (req, _res, next) => {
  try {
    if (schemas.params) {
      req.params = schemas.params.parse(req.params);
    }
    if (schemas.query) {
      req.query = schemas.query.parse(req.query);
    }
    if (schemas.body) {
      req.body = schemas.body.parse(req.body);
    }
    next();
  } catch (error) {
    if (error instanceof ZodError) {
      const details = error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));
      next(ApiError.badRequest('Please correct the highlighted fields.', details));
      return;
    }
    next(error);
  }
};
