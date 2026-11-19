const FORBIDDEN_KEY_PATTERN = /^\$|\./;

function sanitizeValue(value) {
  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }

  if (value && typeof value === 'object' && !(value instanceof Date)) {
    return Object.entries(value).reduce((result, [key, nestedValue]) => {
      if (FORBIDDEN_KEY_PATTERN.test(key)) {
        return result;
      }
      result[key] = sanitizeValue(nestedValue);
      return result;
    }, {});
  }

  return value;
}

export function sanitizeRequest(req, _res, next) {
  if (req.body) {
    req.body = sanitizeValue(req.body);
  }
  if (req.params) {
    req.params = sanitizeValue(req.params);
  }
  next();
}
