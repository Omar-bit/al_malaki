import { API_BASE_URL } from '../services/apiClient';

/**
 * Resolve a server asset path (e.g. `/uploads/profiles/x.jpg`) to an absolute
 * URL against the API origin. Absolute URLs and data URIs are returned as-is.
 */
export function resolveAssetUrl(path: string | null | undefined): string {
  if (!path) return '';
  if (path.startsWith('http') || path.startsWith('data:')) return path;
  return `${API_BASE_URL}${path}`;
}

/** Build a UI Avatars initials fallback URL for a user. */
export function avatarUrl(
  profilePicture: string | null | undefined,
  firstName: string | null | undefined,
  lastName: string | null | undefined,
): string {
  const resolved = resolveAssetUrl(profilePicture);
  if (resolved) return resolved;
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(
    firstName ?? '',
  )}+${encodeURIComponent(lastName ?? '')}&background=random`;
}
