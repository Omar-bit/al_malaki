import * as Joi from 'joi';

/**
 * Boot-time validation for environment variables. Missing or malformed values
 * fail fast with a clear message instead of surfacing as obscure runtime errors.
 *
 * In production a strong `JWT_ACCESS_SECRET` is required — the app must never
 * fall back to the built-in dev secret, which would make tokens forgeable.
 * `unknown(true)` lets the many optional SMTP / branding vars pass through.
 */
export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'test', 'production')
    .default('development'),
  PORT: Joi.number().default(3000),

  DATABASE_URL: Joi.string().required(),

  JWT_ACCESS_SECRET: Joi.string().when('NODE_ENV', {
    is: 'production',
    then: Joi.string()
      .min(16)
      .invalid('dev-only-secret-change-me', 'replace-with-a-strong-secret')
      .required()
      .messages({
        'any.required':
          'JWT_ACCESS_SECRET must be set to a strong value in production',
        'any.invalid':
          'JWT_ACCESS_SECRET must not use the default/example value in production',
      }),
    otherwise: Joi.string().optional(),
  }),

  REDIS_URL: Joi.string()
    .uri({ scheme: ['redis', 'rediss'] })
    .optional(),
  CACHE_DEFAULT_TTL_MS: Joi.number().optional(),

  COOKIE_SAMESITE: Joi.string().valid('lax', 'strict', 'none').optional(),
  COOKIE_SECURE: Joi.string().valid('true', 'false').optional(),
}).unknown(true);
