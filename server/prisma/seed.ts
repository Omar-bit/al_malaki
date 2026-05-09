import { PrismaClient } from '../src/generated/prisma';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { hash } from 'bcryptjs';
import * as dotenv from 'dotenv';

dotenv.config();

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

const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Starting seed...');

  const email = process.env.DEFAULT_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.DEFAULT_ADMIN_PASSWORD?.trim();
  const firstName = process.env.DEFAULT_ADMIN_FIRST_NAME?.trim() || 'Super';
  const lastName = process.env.DEFAULT_ADMIN_LAST_NAME?.trim() || 'Admin';
  const phoneNumber = process.env.DEFAULT_ADMIN_PHONE_NUMBER?.trim() || null;

  if (!email || !password) {
    console.error('DEFAULT_ADMIN_EMAIL and DEFAULT_ADMIN_PASSWORD must be set in .env');
    process.exit(1);
  }

  const adminAccount = await prisma.user.findFirst({
    where: {
      role: 'ADMIN',
    },
  });

  if (adminAccount) {
    console.log('Admin account already exists. Skipping...');
  } else {
    console.log(`Creating default admin account: ${email}`);
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
    console.log('Default admin account created successfully.');
  }

  console.log('Seed completed.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
