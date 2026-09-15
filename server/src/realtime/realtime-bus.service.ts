import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';

type RealtimeHandler = (payload: unknown) => void;

const CHANNEL_PREFIX = 'al_malaki:realtime:';

/**
 * Cross-process fan-out for Server-Sent Events.
 *
 * SSE subscribers are held in memory by the process that accepted the request.
 * Once the API runs more than one worker (see `WEB_CONCURRENCY`), an event
 * produced by worker A must still reach a client connected to worker B, so
 * every emission goes through Redis pub/sub and each worker delivers to its own
 * local subscribers.
 *
 * Without `REDIS_URL` the bus degrades to direct in-process delivery, which is
 * correct for a single-worker dev setup.
 */
@Injectable()
export class RealtimeBusService implements OnModuleDestroy {
  private readonly logger = new Logger(RealtimeBusService.name);
  private readonly publisher: Redis | null;
  private readonly subscriber: Redis | null;
  private readonly handlers = new Map<string, Set<RealtimeHandler>>();

  constructor() {
    const url = process.env.REDIS_URL?.trim();

    if (!url) {
      this.publisher = null;
      this.subscriber = null;
      this.logger.warn(
        'REDIS_URL not set — realtime events stay in-process (single worker only)',
      );
      return;
    }

    // ioredis puts a connection into subscriber mode exclusively, so publishing
    // needs its own connection.
    this.publisher = new Redis(url, { maxRetriesPerRequest: 2 });
    this.subscriber = new Redis(url, { maxRetriesPerRequest: null });

    this.publisher.on('error', (error: Error) =>
      this.logger.error(`Realtime publisher error: ${error.message}`),
    );
    this.subscriber.on('error', (error: Error) =>
      this.logger.error(`Realtime subscriber error: ${error.message}`),
    );

    this.subscriber.on('message', (channel: string, raw: string) => {
      this.handleIncomingMessage(channel, raw);
    });

    this.logger.log('Realtime bus backend: Redis pub/sub');
  }

  /**
   * Broadcast a payload to every worker subscribed to `channel`, including this
   * one. Falls back to local-only delivery when Redis is unavailable so a
   * degraded Redis never silently drops a user's notifications.
   */
  async publish(channel: string, payload: unknown): Promise<void> {
    if (!this.publisher) {
      this.deliverLocally(channel, payload);
      return;
    }

    try {
      await this.publisher.publish(
        `${CHANNEL_PREFIX}${channel}`,
        JSON.stringify(payload),
      );
    } catch (error) {
      this.logger.error(
        `Realtime publish failed on "${channel}": ${(error as Error).message}`,
      );
      this.deliverLocally(channel, payload);
    }
  }

  /** Register a delivery callback for this worker's local subscribers. */
  subscribe(channel: string, handler: RealtimeHandler): void {
    const existing = this.handlers.get(channel);

    if (existing) {
      existing.add(handler);
      return;
    }

    this.handlers.set(channel, new Set([handler]));

    void this.subscriber
      ?.subscribe(`${CHANNEL_PREFIX}${channel}`)
      .catch((error: Error) =>
        this.logger.error(
          `Realtime subscribe failed on "${channel}": ${error.message}`,
        ),
      );
  }

  private handleIncomingMessage(prefixedChannel: string, raw: string): void {
    const channel = prefixedChannel.slice(CHANNEL_PREFIX.length);

    try {
      this.deliverLocally(channel, JSON.parse(raw));
    } catch (error) {
      this.logger.error(
        `Discarded malformed realtime message on "${channel}": ${(error as Error).message}`,
      );
    }
  }

  private deliverLocally(channel: string, payload: unknown): void {
    const handlers = this.handlers.get(channel);

    if (!handlers) {
      return;
    }

    for (const handler of handlers) {
      try {
        handler(payload);
      } catch (error) {
        this.logger.error(
          `Realtime handler failed on "${channel}": ${(error as Error).message}`,
        );
      }
    }
  }

  async onModuleDestroy(): Promise<void> {
    await Promise.allSettled([this.publisher?.quit(), this.subscriber?.quit()]);
  }
}
