import useSWR from 'swr';
import { getSiteContent } from '../services/contentService';
import { EMPTY_SITE_CONTENT, type ContentSlot } from '../types/content';

/**
 * Admin-managed media for the public site. Slots the admin has not filled come
 * back empty, and every consumer falls back to its original built-in asset, so
 * the site renders unchanged until content is uploaded.
 */
export function useSiteContent() {
  const { data = EMPTY_SITE_CONTENT, isLoading } = useSWR(
    'public:content',
    getSiteContent,
  );

  return { content: data, isLoading };
}

export function useContentSlot(slot: ContentSlot) {
  const { content, isLoading } = useSiteContent();
  return { media: content[slot], isLoading };
}
