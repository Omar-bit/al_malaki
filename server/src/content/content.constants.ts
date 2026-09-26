/**
 * Named placements the admin can manage from the content page. Anything not in
 * this list is rejected, so a typo in a request cannot create an orphan slot
 * that the public site never renders.
 */
export const CONTENT_SLOTS = [
  'landing_hero',
  'products_hero',
  'products_featured_left',
  'products_featured_right',
] as const;

export type ContentSlot = (typeof CONTENT_SLOTS)[number];

export function isContentSlot(value: string): value is ContentSlot {
  return (CONTENT_SLOTS as readonly string[]).includes(value);
}
