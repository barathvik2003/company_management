import { z } from 'zod';

/**
 * The app refuses to boot if the environment is wrong. Failing loudly at
 * startup is far better than failing at 2am with a confusing runtime error.
 */
const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3001),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  WEB_ORIGIN: z.string().url().default('http://localhost:3000'),
  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 characters'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),
  JWT_ACCESS_TTL: z.string().default('15m'),
  JWT_REFRESH_TTL: z.string().default('7d'),
  COOKIE_DOMAIN: z.string().default('localhost'),
  COOKIE_SECURE: z.coerce.boolean().default(false),
  RATE_LIMIT_TTL: z.coerce.number().int().positive().default(60),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(120),
  AI_ENABLED: z.coerce.boolean().default(false),
  AI_PROVIDER: z.string().default('none'),
  AI_API_KEY: z.string().optional(),
});

export type AppConfig = z.infer<typeof schema>;

export function validateEnv(raw: Record<string, unknown>): AppConfig {
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    const lines = parsed.error.issues.map((i) => `  - ${i.path.join('.')}: ${i.message}`);
    throw new Error(`Invalid environment configuration:\n${lines.join('\n')}`);
  }
  if (parsed.data.NODE_ENV === 'production') {
    if (parsed.data.JWT_ACCESS_SECRET === parsed.data.JWT_REFRESH_SECRET) {
      throw new Error('JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must differ in production');
    }
    if (!parsed.data.COOKIE_SECURE) {
      throw new Error('COOKIE_SECURE must be true in production');
    }
  }
  return parsed.data;
}
