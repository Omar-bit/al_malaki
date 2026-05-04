import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from './../generated/prisma';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';

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
