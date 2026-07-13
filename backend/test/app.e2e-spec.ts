import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { PawaPayTxStatus, PawaPayTxType } from '@prisma/client';

describe('Fintech Backend (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  const mockPrisma = {
    user: {
      findFirst: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
    },
    cashWallet: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    pawaPayTransaction: {
      create: jest.fn(),
      update: jest.fn(),
      findUnique: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeAll(async () => {
    mockPrisma.$transaction.mockImplementation((callback) => callback(mockPrisma));

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(mockPrisma)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    prisma = moduleFixture.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Auth Flow', () => {
    it('should register a new user', async () => {
      const registerData = {
        email: 'test@baou.ci',
        password: 'SecurePassword123!',
        firstName: 'Jean',
        lastName: 'Koffi',
        phone: '2250701020304',
      };

      mockPrisma.user.findFirst.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue({
        id: 'user-uuid-1',
        email: registerData.email,
        firstName: registerData.firstName,
        lastName: registerData.lastName,
        phone: registerData.phone,
        role: 'CLIENT',
        kycStatus: 'EN_ATTENTE_VALIDATION',
      });
      mockPrisma.cashWallet.create.mockResolvedValue({
        id: 'wallet-uuid',
        userId: 'user-uuid-1',
        balanceTotal: 0.0,
      });

      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerData)
        .expect(201);

      expect(res.body.email).toBe(registerData.email);
      expect(mockPrisma.user.create).toHaveBeenCalled();
      expect(mockPrisma.cashWallet.create).toHaveBeenCalled();
    });

    it('should login and return a JWT token', async () => {
      const loginData = {
        phoneOrEmail: 'test@baou.ci',
        password: 'SecurePassword123!',
      };

      const hashedPassword = await bcrypt.hash(loginData.password, 10);

      mockPrisma.user.findFirst.mockResolvedValue({
        id: 'user-uuid-1',
        email: 'test@baou.ci',
        password: hashedPassword,
        firstName: 'Jean',
        lastName: 'Koffi',
        phone: '2250701020304',
        role: 'CLIENT',
        kycStatus: 'EN_ATTENTE_VALIDATION',
      });

      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginData)
        .expect(200);

      expect(res.body).toHaveProperty('accessToken');
      expect(res.body.user.email).toBe('test@baou.ci');
    });
  });

  describe('Wallets & PawaPay Transactions Flow', () => {
    let jwtToken: string;

    beforeAll(async () => {
      const hashedPassword = await bcrypt.hash('SecurePassword123!', 10);
      const testUser = {
        id: 'user-uuid-1',
        email: 'test@baou.ci',
        password: hashedPassword,
        firstName: 'Jean',
        lastName: 'Koffi',
        phone: '2250701020304',
        role: 'CLIENT',
      };

      mockPrisma.user.findFirst.mockResolvedValue(testUser);
      // Configurer findUnique pour le JwtStrategy validation
      mockPrisma.user.findUnique.mockResolvedValue(testUser);

      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ phoneOrEmail: 'test@baou.ci', password: 'SecurePassword123!' });

      jwtToken = res.body.accessToken;
    });

    it('should retrieve Cash Wallet balance', async () => {
      mockPrisma.cashWallet.findUnique.mockResolvedValue({
        id: 'wallet-uuid',
        userId: 'user-uuid-1',
        balanceTotal: 15000.0,
        balanceFrozen: 0.0,
        currency: 'XOF',
      });

      const res = await request(app.getHttpServer())
        .get('/wallets/cash')
        .set('Authorization', `Bearer ${jwtToken}`)
        .expect(200);

      expect(res.body.balanceTotal).toBe(15000.0);
    });

    it('should retrieve user profile (me)', async () => {
      const res = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${jwtToken}`)
        .expect(200);

      expect(res.body.email).toBe('test@baou.ci');
      expect(res.body.firstName).toBe('Jean');
    });

    it('should initiate a deposit', async () => {
      const depositData = {
        amount: 5000,
        phone: '2250701020304',
        correspondent: 'ORANGE_CI',
      };

      mockPrisma.pawaPayTransaction.create.mockImplementation((args) => Promise.resolve({
        idInternal: args.data.idInternal,
        userId: 'user-uuid-1',
        amount: 5000,
        type: PawaPayTxType.DEPOT,
        status: PawaPayTxStatus.EN_COURS,
      }));

      mockPrisma.pawaPayTransaction.update.mockImplementation((args) => Promise.resolve({
        idInternal: args.where.idInternal,
        idPawaPay: args.data.idPawaPay,
        status: PawaPayTxStatus.EN_COURS,
      }));

      const res = await request(app.getHttpServer())
        .post('/pawapay/deposit')
        .set('Authorization', `Bearer ${jwtToken}`)
        .send(depositData)
        .expect(201);

      expect(res.body.status).toBe('PENDING');
      expect(res.body.idInternal).toBeDefined();
      expect(typeof res.body.idInternal).toBe('string');
    });

    it('should process callback payload and credit wallet', async () => {
      const callbackPayload = {
        depositId: 'tx-1234',
        status: 'COMPLETED',
      };

      mockPrisma.pawaPayTransaction.findUnique.mockResolvedValue({
        idInternal: 'tx-1234',
        userId: 'user-uuid-1',
        amount: 5000,
        type: PawaPayTxType.DEPOT,
        status: PawaPayTxStatus.EN_COURS,
      });

      await request(app.getHttpServer())
        .post('/pawapay/callback')
        .set('x-pawapay-signature', 'VALIDATED_SIMULATED')
        .send(callbackPayload)
        .expect(200);

      expect(mockPrisma.cashWallet.update).toHaveBeenCalled();
      expect(mockPrisma.pawaPayTransaction.update).toHaveBeenCalled();
    });
  });
});
