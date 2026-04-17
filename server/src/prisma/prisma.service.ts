import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from './../generated/prisma';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';

@Injectable()
export class PrismaService extends PrismaClient {
  constructor() {
    const adapter = new PrismaMariaDb({
      host: 'localhost',
      database: 'al_malaki',
      port: 3306,
      user: 'root',
      password: 'admin',
      connectionLimit: 5,
    });
    super({ adapter });
  }
}
