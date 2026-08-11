import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';

interface MemoryEntry {
  value: string;
  expiresAt: number;
}

const DEFAULT_TTL_MS = 60_000;
const MEMORY_MAX_ENTRIES = 5_000;

/**
 * Lightweight cache abstraction backed by Redis when `REDIS_URL` is configured,
 * and by an in-process map otherwise (dev/test, or single-node deploys without
 * Redis). Values are JSON-serialised; since HTTP responses are JSON anyway this
 * is transparent to callers.
 */
@Injectable()
export class CacheService implements OnModuleDestroy {
  private readonly logger = new Logger(CacheService.name);
  private readonly redis: Redis | null;
  private readonly memory = new Map<string, MemoryEntry>();
  private readonly defaultTtlMs: number;

  constructor() {
    const url = process.env.REDIS_URL?.trim();
    this.defaultTtlMs =
      Number(process.env.CACHE_DEFAULT_TTL_MS) || DEFAULT_TTL_MS;

    if (url) {
      this.redis = new Redis(url, {
        maxRetriesPerRequest: 2,
        enableOfflineQueue: false,
      });
      this.redis.on('error', (error: Error) =>
        this.logger.error(`Redis cache error: ${error.message}`),
      );
      this.logger.log('Cache backend: Redis');
    } else {
      this.redis = null;
      this.logger.warn(
        'REDIS_URL not set — falling back to in-memory cache (not shared across instances)',
      );
    }
  }

  async get<T>(key: string): Promise<T | undefined> {
    if (this.redis) {
      try {
        const raw = await this.redis.get(key);
        return raw ? (JSON.parse(raw) as T) : undefined;
      } catch (error) {
        this.logger.error(
          `Cache get failed for "${key}": ${(error as Error).message}`,
        );
        return undefined;
      }
    }

    const entry = this.memory.get(key);
    if (!entry) return undefined;
    if (entry.expiresAt <= Date.now()) {
      this.memory.delete(key);
      return undefined;
    }
    return JSON.parse(entry.value) as T;
  }

  async set<T>(key: string, value: T, ttlMs?: number): Promise<void> {
    const ttl = ttlMs ?? this.defaultTtlMs;
    const raw = JSON.stringify(value);

    if (this.redis) {
      try {
        await this.redis.set(key, raw, 'PX', ttl);
      } catch (error) {
        this.logger.error(
          `Cache set failed for "${key}": ${(error as Error).message}`,
        );
      }
      return;
    }

    if (this.memory.size >= MEMORY_MAX_ENTRIES) {
      this.evictExpiredMemory();
    }
    this.memory.set(key, { value: raw, expiresAt: Date.now() + ttl });
  }

  async del(...keys: string[]): Promise<void> {
    if (keys.length === 0) return;

    if (this.redis) {
      try {
        await this.redis.del(...keys);
      } catch (error) {
        this.logger.error(`Cache delete failed: ${(error as Error).message}`);
      }
      return;
    }

    for (const key of keys) {
      this.memory.delete(key);
    }
  }

  /**
   * Return the cached value for `key`, or compute it via `factory`, store it,
   * and return it. Concurrent callers may briefly run `factory` in parallel;
   * that is acceptable for read-only listing endpoints.
   */
  async wrap<T>(
    key: string,
    factory: () => Promise<T>,
    ttlMs?: number,
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== undefined) return cached;

    const value = await factory();
    await this.set(key, value, ttlMs);
    return value;
  }

  private evictExpiredMemory(): void {
    const now = Date.now();
    for (const [key, entry] of this.memory) {
      if (entry.expiresAt <= now) this.memory.delete(key);
    }
    // If everything is still live, drop the oldest entry to bound growth.
    if (this.memory.size >= MEMORY_MAX_ENTRIES) {
      for (const key of this.memory.keys()) {
        this.memory.delete(key);
        break;
      }
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (this.redis) {
      await this.redis.quit().catch(() => this.redis?.disconnect());
    }
  }
}
