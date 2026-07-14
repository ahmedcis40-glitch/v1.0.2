import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OrdersService } from '../orders/orders.service';
import { KYCStatus, OrderStatus, WaveTxStatus } from '@prisma/client';

@Injectable()
export class AdminService {
  constructor(
    private prisma: PrismaService,
    private ordersService: OrdersService,
  ) {}

  async getUsers() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        whatsappPhone: true,
        role: true,
        kycStatus: true,
        kycDocuments: true,
        sgiPartenaire: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateKycStatus(userId: string, kycStatus: KYCStatus) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException("Utilisateur introuvable.");
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: { kycStatus, updatedAt: new Date() },
      select: {
        id: true,
        email: true,
        kycStatus: true,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        userId,
        action: `KYC_${kycStatus}`,
        details: `Statut KYC mis à jour à ${kycStatus} par l'administrateur`,
        ipAddress: '127.0.0.1',
      },
    });

    return updatedUser;
  }

  async getTransactions() {
    return this.prisma.waveTransaction.findMany({
      include: {
        User: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getIncidents() {
    // 1. Transactions Wave en échec
    const failedTxs = await this.prisma.waveTransaction.findMany({
      where: { status: WaveTxStatus.ECHEC },
      include: { User: { select: { email: true } } },
      orderBy: { updatedAt: 'desc' },
    });

    // 2. Transactions bloquées en "EN_COURS" depuis plus de 5 minutes (anomalie de callback)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const stuckTxs = await this.prisma.waveTransaction.findMany({
      where: {
        status: WaveTxStatus.EN_COURS,
        createdAt: { lt: fiveMinutesAgo },
      },
      include: { User: { select: { email: true } } },
      orderBy: { createdAt: 'desc' },
    });

    return {
      failedTransactions: failedTxs,
      stuckTransactions: stuckTxs,
    };
  }

  async getReporting() {
    // Nombre d'utilisateurs par rôle
    const usersCount = await this.prisma.user.count();
    const clientsCount = await this.prisma.user.count({ where: { role: 'CLIENT' } });

    // Volumes des transactions Wave
    const deposits = await this.prisma.waveTransaction.findMany({
      where: { type: 'DEPOT', status: WaveTxStatus.SUCCES },
      select: { amount: true },
    });
    const totalDeposits = deposits.reduce((sum, tx) => sum + tx.amount, 0);

    const withdraws = await this.prisma.waveTransaction.findMany({
      where: { type: 'RETRAIT', status: WaveTxStatus.SUCCES },
      select: { amount: true },
    });
    const totalWithdraws = withdraws.reduce((sum, tx) => sum + tx.amount, 0);

    // Taux d'échec Wave
    const totalTxs = await this.prisma.waveTransaction.count();
    const failedTxs = await this.prisma.waveTransaction.count({
      where: { status: WaveTxStatus.ECHEC },
    });
    const failureRate = totalTxs > 0 ? (failedTxs / totalTxs) * 100 : 0.0;

    return {
      usersCount,
      clientsCount,
      totalDeposits,
      totalWithdraws,
      totalTransactions: totalTxs,
      failureRate: parseFloat(failureRate.toFixed(2)),
    };
  }

  async getOrders() {
    return this.ordersService.getAllOrders();
  }

  async processOrder(orderId: string, status: OrderStatus, priceReal: number | null) {
    if (status !== OrderStatus.EXECUTE && status !== OrderStatus.ANNULE) {
      throw new BadRequestException("Statut de traitement d'ordre invalide. Seul EXECUTE ou ANNULE sont autorisés.");
    }
    return this.ordersService.updateOrderStatus(orderId, status, priceReal);
  }
}
