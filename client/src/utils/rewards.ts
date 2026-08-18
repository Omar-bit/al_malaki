export type RewardCardType = 'cash' | 'promo' | 'gift' | 'freeShipping';

export interface RewardCard {
  type: RewardCardType;
  cashAmount?: number;
  promoPercent?: number;
  promoCode?: string;
}

const CASH_AMOUNTS = [2, 3, 5];
const PROMO_PERCENTS = [10, 15, 20];

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

/** ISO-ish "year-week" key so the reward rotates once per calendar week. */
export function getRewardPeriodKey(date: Date = new Date()): string {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDays = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
  const week = Math.ceil((pastDays + firstDayOfYear.getDay() + 1) / 7);
  return `${date.getFullYear()}-W${week}`;
}

/** Deterministic per-user, per-week reward so it varies without needing a backend. */
export function getWeeklyReward(
  userId: string,
  periodKey: string = getRewardPeriodKey(),
): RewardCard[] {
  const seed = hashString(`${userId}-${periodKey}`);
  const cashAmount = CASH_AMOUNTS[seed % CASH_AMOUNTS.length];
  const promoPercent =
    PROMO_PERCENTS[Math.floor(seed / CASH_AMOUNTS.length) % PROMO_PERCENTS.length];
  const promoCode = `HONEY${(seed % 90000) + 10000}`;
  const includeGift = seed % 2 === 0;

  return [
    { type: 'cash', cashAmount },
    { type: 'promo', promoPercent, promoCode },
    includeGift ? { type: 'gift' } : { type: 'freeShipping' },
  ];
}

export function getRewardClaimedKey(
  userId: string,
  periodKey: string = getRewardPeriodKey(),
): string {
  return `al-malaki-reward-claimed-${userId}-${periodKey}`;
}
