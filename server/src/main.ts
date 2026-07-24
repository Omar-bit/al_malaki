import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { hash } from 'bcryptjs';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { PrismaService } from './prisma/prisma.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  await seedDefaultAdmin(app.get(PrismaService));

  app.use(cookieParser());

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

  await app.listen(process.env.PORT ?? 3000);
}

async function seedDefaultAdmin(prisma: PrismaService) {
  const email = process.env.DEFAULT_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.DEFAULT_ADMIN_PASSWORD?.trim();
  const firstName = process.env.DEFAULT_ADMIN_FIRST_NAME?.trim() || 'Super';
  const lastName = process.env.DEFAULT_ADMIN_LAST_NAME?.trim() || 'Admin';
  const phoneNumber = process.env.DEFAULT_ADMIN_PHONE_NUMBER?.trim() || null;

  if (!email || !password) {
    console.log('DEFAULT_ADMIN_EMAIL/PASSWORD not set, skipping admin seed');
    return;
  }

  const existing = await prisma.user.findUnique({
    where: { email },
  });

  if (existing) {
    if (existing.role === 'ADMIN') {
      console.log('Admin account already exists, skipping seed');
      return;
    }
    await prisma.user.update({
      where: { email },
      data: { role: 'ADMIN', verifiedEmail: true },
    });
    console.log(`Existing user ${email} promoted to ADMIN`);
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

  console.log(`Default admin account created: ${email}`);
}

bootstrap();
