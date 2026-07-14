import { Test, TestingModule } from '@nestjs/testing';
import { WaveService } from './wave.service';
import { PrismaService } from '../prisma/prisma.service';
import { BadRequestException } from '@nestjs/common';
import { WaveTxStatus, WaveTxType } from '@prisma/client';
import axios from 'axios';

jest.mock('axios');

describe('WaveService', () => {
  let service: WaveService;
  let prisma: PrismaService;

  const mockPrismaService = {
    waveTransaction: {
      create: jest.fn(),
      update: jest.fn(),
      findUnique: jest.fn(),
    },
    cashWallet: {
      findUnique: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    mockPrismaService.$transaction.mockImplementation((callback) => callback(mockPrismaService));

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WaveService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<WaveService>(WaveService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('initiateDeposit', () => {
    it('should create a pending deposit Wave transaction', async () => {
      const userId = 'user-123';
      const dto = { amount: 5000, phone: '2250700000000' };

      mockPrismaService.waveTransaction.create.mockResolvedValue({
        idInternal: 'tx-uuid',
        userId,
        amount: 5000,
        type: WaveTxType.DEPOT,
        status: WaveTxStatus.EN_COURS,
      });

      mockPrismaService.waveTransaction.update.mockResolvedValue({
        idInternal: 'tx-uuid',
        waveSessionId: 'tx-uuid',
        status: WaveTxStatus.EN_COURS,
      });

      const result = await service.initiateDeposit(userId, dto);

      expect(prisma.waveTransaction.create).toHaveBeenCalled();
      expect(prisma.waveTransaction.update).toHaveBeenCalled();
      expect(result.status).toBe('PENDING');
      expect(result.redirectUrl).toBe('https://pay.wave.com/m/M_ci_XRkfDq_9M8GP/c/ci/?src=p');
    });
  });

  describe('initiateWithdrawal', () => {
    it('should throw BadRequestException if balance is insufficient', async () => {
      const userId = 'user-123';
      const dto = { amount: 10000, phone: '2250700000000' };

      mockPrismaService.cashWallet.findUnique.mockResolvedValue({
        userId,
        balanceTotal: 5000,
        balanceFrozen: 0,
      });

      await expect(service.initiateWithdrawal(userId, dto)).rejects.toThrow(BadRequestException);
    });

    it('should process Wave withdrawal and freeze funds if balance is sufficient', async () => {
      const userId = 'user-123';
      const dto = { amount: 5000, phone: '2250700000000' };

      (axios.post as jest.Mock).mockResolvedValue({
        data: {
          id: 'wave-disb-123',
          status: 'pending',
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

      mockPrismaService.waveTransaction.create.mockResolvedValue({
        idInternal: 'tx-uuid',
        userId,
        amount: 5000,
        type: WaveTxType.RETRAIT,
        status: WaveTxStatus.EN_COURS,
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

  describe('handleWebhook', () => {
    it('should credit wallet on successful Wave checkout callback', async () => {
      const payload = {
        type: 'checkout.session.completed',
        data: {
          id: 'wave-session-123',
          client_reference: 'tx-uuid',
          status: 'succeeded',
        },
      };

      mockPrismaService.waveTransaction.findUnique.mockResolvedValue({
        idInternal: 'tx-uuid',
        userId: 'user-123',
        amount: 5000,
        type: WaveTxType.DEPOT,
        status: WaveTxStatus.EN_COURS,
      });

      mockPrismaService.cashWallet.findUnique.mockResolvedValue({
        userId: 'user-123',
        balanceTotal: 0,
      });

      const result = await service.handleWebhook('simulated-signature-value', payload);

      expect(prisma.cashWallet.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'user-123' },
          data: expect.objectContaining({ balanceTotal: { increment: 5000 } }),
        }),
      );
      expect(prisma.waveTransaction.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { idInternal: 'tx-uuid' },
          data: expect.objectContaining({ status: WaveTxStatus.SUCCES }),
        }),
      );
      expect(result.status).toBe('PROCESSED');
    });
  });
});
