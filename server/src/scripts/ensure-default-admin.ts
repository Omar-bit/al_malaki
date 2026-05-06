import 'dotenv/config';
import { hash } from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '../generated/prisma';

const prismaService = new PrismaService();

async function ensureDefaultAdmin(): Promise<void> {
  const email = process.env.DEFAULT_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.DEFAULT_ADMIN_PASSWORD?.trim();
  const firstName = process.env.DEFAULT_ADMIN_FIRST_NAME?.trim() || 'Super';
  const lastName = process.env.DEFAULT_ADMIN_LAST_NAME?.trim() || 'Admin';
  const phoneNumber = process.env.DEFAULT_ADMIN_PHONE_NUMBER?.trim() || null;

  if (!email || !password) {
    throw new Error(
      'DEFAULT_ADMIN_EMAIL and DEFAULT_ADMIN_PASSWORD must be set in .env',
    );
  }

  const adminCount = await prismaService.user.count({
    where: { role: Role.ADMIN },
  });

  if (adminCount > 0) {
    console.log('Admin account already exists. Skipping seed.');
    return;
  }

  const passwordHash = await hash(password, 12);

  await prismaService.user.create({
    data: {
      email,
      firstName,
      lastName,
      phoneNumber,
      passwordHash,
      role: Role.ADMIN,
      verifiedEmail: true,
    },
  });

  console.log(`Default admin created for ${email}.`);
}

ensureDefaultAdmin()
  .catch((error) => {
    console.error('Failed to seed default admin:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prismaService.$disconnect();
  });
