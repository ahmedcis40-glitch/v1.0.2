import { Test, TestingModule } from '@nestjs/testing';
import { PawaPayService } from './pawapay.service';
import { PrismaService } from '../prisma/prisma.service';
import { BadRequestException } from '@nestjs/common';
import { PawaPayTxStatus, PawaPayTxType } from '@prisma/client';
import axios from 'axios';

jest.mock('axios');

describe('PawaPayService', () => {
  let service: PawaPayService;
  let prisma: PrismaService;

  const mockPrismaService = {
    pawaPayTransaction: {
      create: jest.fn(),
      update: jest.fn(),
      findUnique: jest.fn(),
    },
    cashWallet: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    // Réinitialiser les mocks
    jest.clearAllMocks();
    mockPrismaService.$transaction.mockImplementation((callback) => callback(mockPrismaService));

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PawaPayService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<PawaPayService>(PawaPayService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('initiateDeposit', () => {
    it('should create a pending deposit transaction', async () => {
      const userId = 'user-123';
      const dto = { amount: 5000, phone: '2250700000000', correspondent: 'ORANGE_CI' };

      (axios.post as jest.Mock).mockResolvedValue({
        data: {
          depositId: 'tx-uuid',
          status: 'ACCEPTED',
          redirectUrl: 'https://redirect-url.com',
        },
      });

      mockPrismaService.pawaPayTransaction.create.mockResolvedValue({
        idInternal: 'tx-uuid',
        userId,
        amount: 5000,
        type: PawaPayTxType.DEPOT,
        status: PawaPayTxStatus.EN_COURS,
      });

      mockPrismaService.pawaPayTransaction.update.mockResolvedValue({
        idInternal: 'tx-uuid',
        idPawaPay: 'tx-uuid',
        status: PawaPayTxStatus.EN_COURS,
      });

      const result = await service.initiateDeposit(userId, dto);

      expect(prisma.pawaPayTransaction.create).toHaveBeenCalled();
      expect(prisma.pawaPayTransaction.update).toHaveBeenCalled();
      expect(result.status).toBe('PENDING');
    });
  });

  describe('initiateWithdrawal', () => {
    it('should throw BadRequestException if balance is insufficient', async () => {
      const userId = 'user-123';
      const dto = { amount: 10000, phone: '2250700000000', correspondent: 'ORANGE_CI' };

      mockPrismaService.cashWallet.findUnique.mockResolvedValue({
        userId,
        balanceTotal: 5000, // Insuffisant
        balanceFrozen: 0,
      });

      await expect(service.initiateWithdrawal(userId, dto)).rejects.toThrow(BadRequestException);
    });

    it('should process withdrawal and freeze funds if balance is sufficient', async () => {
      const userId = 'user-123';
      const dto = { amount: 5000, phone: '2250700000000', correspondent: 'ORANGE_CI' };

      (axios.post as jest.Mock).mockResolvedValue({
        data: {
          payoutId: 'tx-uuid',
          status: 'ACCEPTED',
        },
      });

      mockPrismaService.cashWallet.findUnique.mockResolvedValue({
        userId,
        balanceTotal: 10000,
        balanceFrozen: 0,
      });

      mockPrismaService.cashWallet.update.mockResolvedValue({
        userId,
        balanceTotal: 5000,
        balanceFrozen: 5000,
      });

      mockPrismaService.pawaPayTransaction.create.mockResolvedValue({
        idInternal: 'tx-uuid',
        userId,
        amount: 5000,
        type: PawaPayTxType.RETRAIT,
        status: PawaPayTxStatus.EN_COURS,
      });

      const result = await service.initiateWithdrawal(userId, dto);

      expect(prisma.cashWallet.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: {
            balanceTotal: { decrement: 5000 },
            balanceFrozen: { increment: 5000 },
          },
        }),
      );
      expect(result.status).toBe('PENDING');
    });
  });

  describe('handleCallback', () => {
    it('should credit wallet on successful deposit callback', async () => {
      const payload = {
        depositId: 'tx-uuid',
        status: 'COMPLETED',
      };

      mockPrismaService.pawaPayTransaction.findUnique.mockResolvedValue({
        idInternal: 'tx-uuid',
        userId: 'user-123',
        amount: 5000,
        type: PawaPayTxType.DEPOT,
        status: PawaPayTxStatus.EN_COURS,
      });

      const result = await service.handleCallback('simulated-signature-value', payload);

      expect(prisma.cashWallet.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'user-123' },
          data: { balanceTotal: { increment: 5000 } },
        }),
      );
      expect(prisma.pawaPayTransaction.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { idInternal: 'tx-uuid' },
          data: expect.objectContaining({ status: PawaPayTxStatus.SUCCES }),
        }),
      );
      expect(result.status).toBe('PROCESSED');
    });

    it('should refund wallet on failed withdrawal callback', async () => {
      const payload = {
        payoutId: 'tx-uuid',
        status: 'FAILED',
        failureCode: 'INSUFFICIENT_FUNDS',
      };

      mockPrismaService.pawaPayTransaction.findUnique.mockResolvedValue({
        idInternal: 'tx-uuid',
        userId: 'user-123',
        amount: 5000,
        type: PawaPayTxType.RETRAIT,
        status: PawaPayTxStatus.EN_COURS,
      });

      const result = await service.handleCallback('simulated-signature-value', payload);

      expect(prisma.cashWallet.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'user-123' },
          data: {
            balanceTotal: { increment: 5000 },
            balanceFrozen: { decrement: 5000 },
          },
        }),
      );
      expect(prisma.pawaPayTransaction.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { idInternal: 'tx-uuid' },
          data: expect.objectContaining({ status: PawaPayTxStatus.ECHEC }),
        }),
      );
      expect(result.status).toBe('PROCESSED');
    });
  });
});
