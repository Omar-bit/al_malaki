import type { CSSProperties } from 'react';
import type { ContentMedia } from '../types/content';

/**
 * The framing the admin picked in the crop editor, as inline styles.
 *
 * The admin preview and the public site both render media with these exact
 * styles over `object-fit: cover`, so what the admin frames is what visitors
 * see.
 */
export function contentMediaStyle(
  media: Pick<ContentMedia, 'focalX' | 'focalY' | 'zoom'>,
): CSSProperties {
  return {
    objectPosition: `${media.focalX}% ${media.focalY}%`,
    transform: `scale(${media.zoom})`,
  };
}
