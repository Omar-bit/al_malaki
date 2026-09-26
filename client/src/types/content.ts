/** Named placements managed from the admin content page. */
export const CONTENT_SLOTS = [
  'landing_hero',
  'products_hero',
  'products_featured_left',
  'products_featured_right',
] as const;

export type ContentSlot = (typeof CONTENT_SLOTS)[number];

export interface ContentMedia {
  id: string;
  slot: ContentSlot;
  type: 'image' | 'video';
  url: string;
  position: number;
  /** Horizontal focal point, as a percentage of the media width. */
  focalX: number;
  /** Vertical focal point, as a percentage of the media height. */
  focalY: number;
  /** Framing zoom the admin picked, 1 = fit to the frame. */
  zoom: number;
}

export type SiteContent = Record<ContentSlot, ContentMedia[]>;

export const EMPTY_SITE_CONTENT: SiteContent = {
  landing_hero: [],
  products_hero: [],
  products_featured_left: [],
  products_featured_right: [],
};

/** Labels and guidance shown on the admin content page. */
export const CONTENT_SLOT_META: Record<
  ContentSlot,
  { title: string; description: string; previewAspect: string }
> = {
  landing_hero: {
    title: 'Landing hero',
    description:
      'Background of the hero section on the home page. Images or videos — add more than one to show them as a slider.',
    previewAspect: '16 / 9',
  },
  products_hero: {
    title: 'Products hero',
    description:
      'Background of the hero section at the top of the products page.',
    previewAspect: '16 / 9',
  },
  products_featured_left: {
    title: 'Featured — tall frame',
    description:
      'The tall image on the left of the featured section at the bottom of the products page.',
    previewAspect: '2 / 3',
  },
  products_featured_right: {
    title: 'Featured — wide frame',
    description:
      'The image under the text on the right of the featured section at the bottom of the products page.',
    previewAspect: '4 / 3',
  },
};
