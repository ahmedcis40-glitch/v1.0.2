import { PrismaClient, Role, KYCStatus } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';
import 'dotenv/config';

const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
  throw new Error('DATABASE_URL variable d\'environnement manquante');
}

console.log('Seed configuration: PostgreSQL pool adapter activated.');
const pool = new Pool({ 
  connectionString: dbUrl,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log(`Starting database seeding...`);

  const userCount = await prisma.user.count();
  if (userCount > 0) {
    console.log('Database already contains data. Skipping seed.');
    return;
  }

  // Clean existing database records
  await prisma.auditLog.deleteMany({});
  await prisma.waveTransaction.deleteMany({});
  await prisma.dcaPlan.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.securitiesWallet.deleteMany({});
  await prisma.cashWallet.deleteMany({});
  await prisma.user.deleteMany({});

  const passwordHash = await bcrypt.hash('password123', 10);

  // 1. Create SGI Admin
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@sgi.ci',
      password: passwordHash,
      firstName: 'Directeur',
      lastName: 'SGI',
      phone: '+2250707070701',
      role: Role.ADMIN_KYC,
      kycStatus: KYCStatus.APPROUVE,
      consentSMS: true,
    },
  });
  console.log(`Seeded Admin User: ${adminUser.email}`);

  // 2. Create SGI Client with cash wallet and securities wallet
  const clientUser = await prisma.user.create({
    data: {
      email: 'client@sgi.ci',
      password: passwordHash,
      firstName: 'Jean',
      lastName: 'Koffi',
      phone: '+2250707070703',
      role: Role.CLIENT,
      kycStatus: KYCStatus.APPROUVE,
      consentSMS: true,
      CashWallet: {
        create: {
          id: 'wallet-seed-id-1',
          balanceTotal: 1000000.0,
          balanceFrozen: 0.0,
          currency: 'XOF',
          updatedAt: new Date(),
        },
      },
      SecuritiesWallet: {
        createMany: {
          data: [
            { id: 'sec-seed-id-1', codeValeur: 'SNTS', quantity: 50, averageBuyPrice: 16500.0, updatedAt: new Date() },
            { id: 'sec-seed-id-2', codeValeur: 'CIEC', quantity: 100, averageBuyPrice: 2100.0, updatedAt: new Date() },
          ],
        },
      },
    },
  });
  console.log(`Seeded Client User: ${clientUser.email}`);

  console.log('Database seeding completed successfully.');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
