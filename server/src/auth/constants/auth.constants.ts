import { CookieOptions } from 'express';

export const AUTH_COOKIE_NAME = 'al_malaki_access_token';
export const DEFAULT_JWT_SECRET = 'dev-only-secret-change-me';
export const DEFAULT_JWT_EXPIRES_IN_SECONDS = 7 * 24 * 60 * 60;
export const DEFAULT_COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

type SameSite = 'lax' | 'strict' | 'none';

function resolveSameSite(): SameSite {
  const value = process.env.COOKIE_SAMESITE?.trim().toLowerCase();
  if (value === 'strict' || value === 'none' || value === 'lax') {
    return value;
  }
  return 'lax';
}

function resolveSecure(isProduction: boolean, sameSite: SameSite): boolean {
  // SameSite=None is only honoured by browsers when the cookie is Secure.
  if (sameSite === 'none') return true;

  const value = process.env.COOKIE_SECURE?.trim().toLowerCase();
  if (value === 'true') return true;
  if (value === 'false') return false;
  return isProduction;
}

export function buildAuthCookieOptions(
  isProduction: boolean,
  maxAge: number,
): CookieOptions {
  const sameSite = resolveSameSite();
  return {
    httpOnly: true,
    secure: resolveSecure(isProduction, sameSite),
    sameSite,
    maxAge,
    path: '/',
  };
}
