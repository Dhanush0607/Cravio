process.env.NODE_ENV = 'test';
process.env.MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/cravio_test';
process.env.JWT_SECRET =
  process.env.JWT_SECRET || 'cravio-test-secret-that-is-long-enough-1234567890';
process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';
process.env.CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';
process.env.COOKIE_SECURE = 'false';
process.env.PAYMENTS_DEV_MODE = 'true';
