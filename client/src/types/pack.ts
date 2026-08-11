export type PackSize = 2 | 4 | 6;
export type PackDiscountPercent = 5 | 10 | 15;

export interface PackSizeOption {
  slots: PackSize;
  label: string;
  tagline: string;
  discountPercent: PackDiscountPercent;
  highlight?: boolean;
}

export const PACK_SIZE_OPTIONS: PackSizeOption[] = [
  {
    slots: 2,
    label: 'Duo',
    tagline: 'A thoughtful pairing',
    discountPercent: 5,
  },
  {
    slots: 4,
    label: 'Signature',
    tagline: 'Our most gifted box',
    discountPercent: 10,
    highlight: true,
  },
  {
    slots: 6,
    label: 'Grand',
    tagline: 'The complete harvest',
    discountPercent: 15,
  },
];

/** Display name for a pack of a given size — used by the builder, cart and checkout. */
export function getPackLabel(slots: number): string {
  return (
    PACK_SIZE_OPTIONS.find((option) => option.slots === slots)?.label ??
    `${slots}-Jar`
  );
}

/** The next size up, if there is one — powers the "unlock a bigger saving" nudge. */
export function getNextTier(slots: number): PackSizeOption | null {
  return PACK_SIZE_OPTIONS.find((option) => option.slots > slots) ?? null;
}

export const PACK_GIFT_NOTE_MAX = 200;
export const PACK_DRAFT_STORAGE_KEY = 'al_malaki_pack_draft';

export interface PackSelection {
  productId: string;
  name: string;
  image: string;
  price: number;
  slug: string;
}

export interface PackCartEntry {
  packId: string;
  slots: PackSize;
  discountPercent: PackDiscountPercent;
  selections: PackSelection[];
  subtotal: number;
  discountAmount: number;
  total: number;
  giftMessage?: string;
}

/** An in-progress build, persisted so a refresh doesn't lose the customer's work. */
export interface PackDraft {
  slots: PackSize;
  selections: PackSelection[];
  giftMessage: string;
}
