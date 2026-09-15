import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from './../generated/prisma';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';

/** Per-worker database connections. See the note in the constructor. */
const DEFAULT_POOL_SIZE = 5;

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl) {
      throw new Error('DATABASE_URL environment variable is required');
    }

    const url = new URL(databaseUrl);
    if (!url.searchParams.has('allowPublicKeyRetrieval')) {
      url.searchParams.set('allowPublicKeyRetrieval', 'true');
    }

    // Every worker process builds its own connection pool, so the server-wide
    // total is `WEB_CONCURRENCY * connectionLimit`. Left at the driver default
    // of 10, a many-core host would blow past MySQL's `max_connections` (151 by
    // default), so the limit is pinned to a modest value here.
    if (!url.searchParams.has('connectionLimit')) {
      url.searchParams.set(
        'connectionLimit',
        process.env.DB_CONNECTION_LIMIT?.trim() || String(DEFAULT_POOL_SIZE),
      );
    }

    const adapter = new PrismaMariaDb(url.toString(), {
      database: url.pathname.replace(/^\//, ''),
    });

    super({ adapter });
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
