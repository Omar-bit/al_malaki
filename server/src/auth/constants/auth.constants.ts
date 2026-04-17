import { CookieOptions } from 'express';

export const AUTH_COOKIE_NAME = 'al_malaki_access_token';
export const DEFAULT_JWT_SECRET = 'dev-only-secret-change-me';
export const DEFAULT_JWT_EXPIRES_IN_SECONDS = 7 * 24 * 60 * 60;
export const DEFAULT_COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export function buildAuthCookieOptions(
  isProduction: boolean,
  maxAge: number,
): CookieOptions {
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    maxAge,
    path: '/',
  };
}
