import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { z } from 'zod';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(currentDir, '../.env') });

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(5000),
  MONGO_URI: z.string().min(1, 'MONGO_URI is required'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must contain at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  CLIENT_URL: z.string().url().default('http://localhost:5173'),
  CLIENT_URLS: z.string().optional().default(''),
  COOKIE_SECURE: z
    .enum(['true', 'false'])
    .optional()
    .transform((value) => value === 'true'),
  PAYMENTS_DEV_MODE: z
    .enum(['true', 'false'])
    .optional()
    .default('false')
    .transform((value) => value === 'true'),
  RAZORPAY_KEY_ID: z.string().optional().default(''),
  RAZORPAY_KEY_SECRET: z.string().optional().default(''),
  CLOUDINARY_CLOUD_NAME: z.string().optional().default(''),
  CLOUDINARY_API_KEY: z.string().optional().default(''),
  CLOUDINARY_API_SECRET: z.string().optional().default(''),
  ADMIN_NAME: z.string().optional().default('Cravio Administrator'),
  ADMIN_EMAIL: z.string().email().optional().default('admin@cravio.dev'),
  ADMIN_PASSWORD: z.string().optional().default(''),
  SEED_DEMO_PASSWORD: z.string().optional().default('DemoCustomer123!'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const details = parsed.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`);
  console.error('Invalid environment configuration:\n' + details.join('\n'));
  throw new Error('Environment validation failed');
}

const raw = parsed.data;
const isProduction = raw.NODE_ENV === 'production';
const clientOrigins = [raw.CLIENT_URL, ...raw.CLIENT_URLS.split(',')]
  .map((origin) => origin.trim())
  .filter(Boolean);

if (isProduction && raw.PAYMENTS_DEV_MODE) {
  throw new Error('PAYMENTS_DEV_MODE cannot be enabled in production');
}

if (isProduction && !raw.COOKIE_SECURE) {
  throw new Error('COOKIE_SECURE must be true in production');
}

if (isProduction && !raw.ADMIN_PASSWORD) {
  console.warn('ADMIN_PASSWORD is not set. Production seeding will refuse to create an administrator.');
}

export const env = {
  ...raw,
  isProduction,
  isTest: raw.NODE_ENV === 'test',
  cookieSecure: raw.COOKIE_SECURE ?? isProduction,
  clientOrigins: [...new Set(clientOrigins)],
  cloudinaryEnabled: Boolean(
    raw.CLOUDINARY_CLOUD_NAME && raw.CLOUDINARY_API_KEY && raw.CLOUDINARY_API_SECRET
  ),
  razorpayEnabled: Boolean(raw.RAZORPAY_KEY_ID && raw.RAZORPAY_KEY_SECRET),
};
