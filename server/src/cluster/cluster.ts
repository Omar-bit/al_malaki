import { Logger } from '@nestjs/common';
import cluster from 'node:cluster';
import { availableParallelism } from 'node:os';

const logger = new Logger('Cluster');

/** A worker dying sooner than this after being forked counts as a crash loop. */
const HEALTHY_WORKER_UPTIME_MS = 10_000;

/** How many crash-looping workers we tolerate before giving up on the process. */
const MAX_RAPID_RESTARTS = 5;

/**
 * How many HTTP workers to run.
 *
 * `WEB_CONCURRENCY` wins when set. Outside production we stay single-process:
 * clustering multiplies boot logs and fights the watcher, and the shared state
 * this relies on (Redis) is usually absent locally. Otherwise we use every core
 * the container is allowed to use — `availableParallelism()` respects the
 * container's CPU affinity, unlike `cpus().length`, which reports the whole host.
 */
export function resolveWorkerCount(): number {
  const configured = Number(process.env.WEB_CONCURRENCY);

  if (Number.isInteger(configured) && configured > 0) {
    return configured;
  }

  if (process.env.NODE_ENV !== 'production') {
    return 1;
  }

  return Math.max(1, availableParallelism());
}

/** True for the single worker allowed to run once-per-deployment startup work. */
export function isLeaderProcess(): boolean {
  return !cluster.isWorker || cluster.worker?.id === 1;
}

/**
 * Node runs JavaScript on one thread, so a single process can only saturate one
 * core. The primary process forks one worker per core; they share the listening
 * socket and the OS load-balances connections between them.
 *
 * State that used to be safely process-local must be shared for this to be
 * correct — SSE fan-out goes through Redis pub/sub (`RealtimeBusService`), rate
 * limit counters through Redis (`RedisThrottlerStorage`), and cached values
 * through Redis (`CacheService`).
 */
export async function runClustered(
  bootstrap: () => Promise<void>,
): Promise<void> {
  const workerCount = resolveWorkerCount();

  if (workerCount === 1 || !cluster.isPrimary) {
    await bootstrap();
    return;
  }

  logger.log(`Primary ${process.pid} starting ${workerCount} workers`);

  const forkedAt = new Map<number, number>();
  let rapidRestarts = 0;
  let isShuttingDown = false;

  const fork = () => {
    const worker = cluster.fork();
    forkedAt.set(worker.id, Date.now());
  };

  for (let index = 0; index < workerCount; index += 1) {
    fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    if (isShuttingDown) {
      return;
    }

    const startedAt = forkedAt.get(worker.id) ?? Date.now();
    forkedAt.delete(worker.id);
    const reason = signal || `code ${code}`;

    // A worker that dies during boot will die again for the same reason — a
    // taken port, a bad config, an unreachable database. Restarting it forever
    // buries the real error under a flood of startup logs, so we stop instead.
    if (Date.now() - startedAt < HEALTHY_WORKER_UPTIME_MS) {
      rapidRestarts += 1;

      if (rapidRestarts >= MAX_RAPID_RESTARTS) {
        isShuttingDown = true;
        logger.error(
          `Worker ${worker.process.pid} exited (${reason}) during startup. ` +
            `Giving up after ${rapidRestarts} failed starts — see the error above.`,
        );

        for (const other of Object.values(cluster.workers ?? {})) {
          other?.kill('SIGTERM');
        }

        process.exit(1);
      }
    } else {
      rapidRestarts = 0;
    }

    logger.error(`Worker ${worker.process.pid} exited (${reason}) — restarting`);
    fork();
  });

  // Forward termination signals so workers close their connections and run
  // shutdown hooks instead of being killed outright by the container runtime.
  for (const signal of ['SIGTERM', 'SIGINT'] as const) {
    process.on(signal, () => {
      isShuttingDown = true;
      logger.log(`Received ${signal}, shutting workers down`);

      for (const worker of Object.values(cluster.workers ?? {})) {
        worker?.kill(signal);
      }
    });
  }
}
