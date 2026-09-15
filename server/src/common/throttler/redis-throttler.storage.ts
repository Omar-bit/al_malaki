import { Injectable, Logger, OnApplicationShutdown } from '@nestjs/common';
import { ThrottlerStorage, ThrottlerStorageService } from '@nestjs/throttler';
import Redis from 'ioredis';

// `ThrottlerStorageRecord` is not re-exported from the package root, so derive
// it from the public interface rather than deep-importing a dist path.
type ThrottlerStorageRecord = Awaited<
  ReturnType<ThrottlerStorage['increment']>
>;

/**
 * Atomically increments the request counter and applies the block. Doing this
 * in one round trip keeps the limit exact when several workers hit the same key
 * concurrently.
 *
 * Returns: { totalHits, hitsPttlMs, isBlocked, blockPttlMs }
 */
const INCREMENT_SCRIPT = `
local hitsKey = KEYS[1]
local blockKey = KEYS[2]
local ttl = tonumber(ARGV[1])
local limit = tonumber(ARGV[2])
local blockDuration = tonumber(ARGV[3])

local blockPttl = redis.call('PTTL', blockKey)
if blockPttl > 0 then
  local blockedHits = tonumber(redis.call('GET', hitsKey) or '0')
  local blockedWindowPttl = redis.call('PTTL', hitsKey)
  if blockedWindowPttl < 0 then
    blockedWindowPttl = 0
  end
  return { blockedHits, blockedWindowPttl, 1, blockPttl }
end

local hits = redis.call('INCR', hitsKey)
local hitsPttl = redis.call('PTTL', hitsKey)
if hitsPttl < 0 then
  redis.call('PEXPIRE', hitsKey, ttl)
  hitsPttl = ttl
end

if hits > limit then
  redis.call('SET', blockKey, 1, 'PX', blockDuration)
  return { hits, hitsPttl, 1, blockDuration }
end

return { hits, hitsPttl, 0, 0 }
`;

const KEY_PREFIX = 'al_malaki:throttle:';

const toSeconds = (milliseconds: number): number =>
  Math.ceil(milliseconds / 1000);

/**
 * Rate-limit counters shared by every API worker.
 *
 * The default `@nestjs/throttler` storage is an in-process map, so running N
 * workers would multiply every configured limit by N. Backing the counters with
 * Redis keeps a limit of "120 requests / minute / IP" accurate no matter how
 * many workers or containers are serving traffic.
 *
 * When `REDIS_URL` is unset (dev/test), it delegates to the stock in-memory
 * storage, which is correct for a single worker.
 */
@Injectable()
export class RedisThrottlerStorage
  implements ThrottlerStorage, OnApplicationShutdown
{
  private readonly logger = new Logger(RedisThrottlerStorage.name);
  private readonly redis: Redis | null;
  private readonly fallback = new ThrottlerStorageService();

  constructor() {
    const url = process.env.REDIS_URL?.trim();

    if (!url) {
      this.redis = null;
      this.logger.warn(
        'REDIS_URL not set — rate limits are per-process (single worker only)',
      );
      return;
    }

    this.redis = new Redis(url, { maxRetriesPerRequest: 2 });
    this.redis.on('error', (error: Error) =>
      this.logger.error(`Throttler storage error: ${error.message}`),
    );
    this.logger.log('Rate-limit storage: Redis');
  }

  async increment(
    key: string,
    ttl: number,
    limit: number,
    blockDuration: number,
    throttlerName: string,
  ): Promise<ThrottlerStorageRecord> {
    if (!this.redis) {
      return this.fallback.increment(
        key,
        ttl,
        limit,
        blockDuration,
        throttlerName,
      );
    }

    // `blockDuration` defaults to 0 when unset; Redis rejects a zero PX.
    const effectiveBlockDuration = blockDuration > 0 ? blockDuration : ttl;
    const namespacedKey = `${KEY_PREFIX}${throttlerName}:${key}`;

    try {
      const [totalHits, hitsPttl, isBlocked, blockPttl] =
        (await this.redis.eval(
          INCREMENT_SCRIPT,
          2,
          namespacedKey,
          `${namespacedKey}:blocked`,
          ttl,
          limit,
          effectiveBlockDuration,
        )) as [number, number, number, number];

      return {
        totalHits,
        timeToExpire: toSeconds(hitsPttl),
        isBlocked: isBlocked === 1,
        timeToBlockExpire: toSeconds(blockPttl),
      };
    } catch (error) {
      // Never turn a Redis outage into a total outage: fall back to the local
      // counter, which limits per worker rather than not at all.
      this.logger.error(
        `Throttler increment failed, using in-memory fallback: ${(error as Error).message}`,
      );
      return this.fallback.increment(
        key,
        ttl,
        limit,
        blockDuration,
        throttlerName,
      );
    }
  }

  async onApplicationShutdown(): Promise<void> {
    this.fallback.onApplicationShutdown();
    await this.redis?.quit();
  }
}
