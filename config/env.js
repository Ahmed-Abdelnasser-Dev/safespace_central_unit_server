/**
 * Environment configuration validation
 *
 * Validates required environment variables once at startup to fail fast.
 */

const { z } = require('zod');

const envBoolean = (defaultValue = false) =>
  z.preprocess((value) => {
    if (typeof value === 'boolean') {
      return value;
    }

    if (typeof value === 'string') {
      const normalized = value.trim().toLowerCase();
      if (normalized === 'true' || normalized === '1' || normalized === 'yes' || normalized === 'on') {
        return true;
      }
      if (normalized === 'false' || normalized === '0' || normalized === 'no' || normalized === 'off' || normalized === '') {
        return false;
      }
    }

    return value;
  }, z.boolean().default(defaultValue));

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(5000),
  HOST: z.string().min(1).default('0.0.0.0'),
  FRONTEND_URL: z.string().url().default('http://localhost:4000'),
  ALLOWED_ORIGINS: z.string().min(1).default('http://localhost:4000'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 chars'),
  JWT_REFRESH_SECRET: z.string().min(16, 'JWT_REFRESH_SECRET must be at least 16 chars'),
  LOG_LEVEL: z.string().optional(),
  MOBILE_APP_SERVER_URL: z.string().url().optional(),
  MOBILE_SERVER_BASE_URL: z.string().url().optional(),
  MOBILE_APP_PROXY_HEADER_NAME: z.string().optional(),
  MOBILE_APP_PROXY_HEADER_VALUE: z.string().optional(),
  MOBILE_APP_CLIENT_CERT_HEADER_NAME: z.string().optional(),
  MOBILE_APP_CLIENT_CERT_HEADER_VALUE: z.string().optional(),
  MOBILE_SERVER_SHARED_SECRET: z.string().optional(),
  ENFORCE_NODE_API_KEY: envBoolean(false),
  ENFORCE_MOBILE_SERVER_AUTH: envBoolean(false),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const formatted = parsed.error.issues
    .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
    .join('; ');
  throw new Error(`Invalid environment configuration: ${formatted}`);
}

module.exports = parsed.data;
