/** 1 loyalty point → TND conversion rate */
export const POINTS_REDEMPTION_RATE = 0.05;

/** Loyalty points required to unlock the weekly surprise reward */
export const REWARD_UNLOCK_POINTS = 100;

/** Build a UI Avatars initials URL */
export function uiAvatarsUrl(firstName: string, lastName: string): string {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(firstName)}+${encodeURIComponent(lastName)}&background=random`;
}
