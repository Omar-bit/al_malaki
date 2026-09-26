import type { CSSProperties } from 'react';
import type { ContentMedia } from '../types/content';

/**
 * The framing the admin picked in the crop editor, as inline styles.
 *
 * The admin preview and the public site both render media with these exact
 * styles over `object-fit: cover`. The preview frame uses the slot's measured
 * aspect ratio, so the crop the admin picks is what visitors see — give or take
 * the small shift that comes from the live frames being sized in `vh`.
 */
export function contentMediaStyle(
  media: Pick<ContentMedia, 'focalX' | 'focalY' | 'zoom'>,
): CSSProperties {
  return {
    objectPosition: `${media.focalX}% ${media.focalY}%`,
    transform: `scale(${media.zoom})`,
    // Anchor the zoom on the focal point. Without this, `object-position` can
    // only pan the axis that `object-fit: cover` left slack on — the other axis
    // has nothing hidden to reveal, so it appears frozen. Scaling about the
    // focal point makes both axes meaningful as soon as the admin zooms in.
    transformOrigin: `${media.focalX}% ${media.focalY}%`,
  };
}
