import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    fileParallelism: false,
    setupFiles: ['./tests/setup.js'],
    hookTimeout: 30_000,
    testTimeout: 30_000,
    env: {
      NODE_ENV: 'test',
      PORT: '5001',
      MONGO_URI: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/cravio_test?replicaSet=rs0',
      JWT_SECRET: 'cravio-test-secret-that-is-long-enough-1234567890',
      JWT_EXPIRES_IN: '1h',
      CLIENT_URL: 'http://localhost:5173',
      COOKIE_SECURE: 'false',
      PAYMENTS_DEV_MODE: 'true',
    },
  },
});
