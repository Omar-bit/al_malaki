import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { hash } from 'bcryptjs';
import cookieParser from 'cookie-parser';
import express from 'express';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { PrismaService } from './prisma/prisma.service';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // Behind a reverse proxy (recommended same-domain deploy), trust the proxy so
  // client IPs (used by rate limiting) and protocol are read from X-Forwarded-*.
  if (process.env.TRUST_PROXY === 'true') {
    app.getHttpAdapter().getInstance().set('trust proxy', 1);
  }

  await seedDefaultAdmin(app.get(PrismaService));

  // Security headers. Keep cross-origin resource policy permissive so that
  // uploaded images under /uploads remain loadable from the frontend origin.
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );

  app.use(cookieParser());
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ limit: '1mb', extended: true }));

  const allowedOrigins = (process.env.CLIENT_ORIGIN ?? 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new AllExceptionsFilter());

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  logger.log(`Application is running on port ${port}`);
}

async function seedDefaultAdmin(prisma: PrismaService) {
  const logger = new Logger('AdminSeed');
  const email = process.env.DEFAULT_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.DEFAULT_ADMIN_PASSWORD?.trim();
  const firstName = process.env.DEFAULT_ADMIN_FIRST_NAME?.trim() || 'Super';
  const lastName = process.env.DEFAULT_ADMIN_LAST_NAME?.trim() || 'Admin';
  const phoneNumber = process.env.DEFAULT_ADMIN_PHONE_NUMBER?.trim() || null;

  if (!email || !password) {
    logger.log('DEFAULT_ADMIN_EMAIL/PASSWORD not set, skipping admin seed');
    return;
  }

  const existing = await prisma.user.findUnique({
    where: { email },
  });

  if (existing) {
    if (existing.role === 'ADMIN') {
      logger.log('Admin account already exists, skipping seed');
      return;
    }
    await prisma.user.update({
      where: { email },
      data: { role: 'ADMIN', verifiedEmail: true },
    });
    logger.log(`Existing user ${email} promoted to ADMIN`);
    return;
  }

  const hashedPassword = await hash(password, 12);
  await prisma.user.create({
    data: {
      email,
      passwordHash: hashedPassword,
      firstName,
      lastName,
      phoneNumber,
      role: 'ADMIN',
      verifiedEmail: true,
    },
  });

  logger.log(`Default admin account created: ${email}`);
}

bootstrap();
