import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WalletsService } from '../wallets/wallets.service';
import { OrderStatus, OrderType } from '@prisma/client';
import * as crypto from 'crypto';

export const COMMISSION_RATE = 0.015; // Commission SGI de 1.5%

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private walletsService: WalletsService,
  ) {}

  async createOrder(userId: string, dto: any) {
    const { type, codeValeur, quantityRequested, priceRequested } = dto;

    if (quantityRequested <= 0 || priceRequested <= 0) {
      throw new BadRequestException("La quantité et le prix doivent être supérieurs à zéro.");
    }

    // Check if user is approved
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.kycStatus !== 'APPROUVE') {
      throw new BadRequestException("Votre compte n'est pas encore approuvé par le KYC.");
    }

    if (type === OrderType.ACHAT) {
      const estimatedCost = quantityRequested * priceRequested * (1 + COMMISSION_RATE);
      await this.walletsService.freezeCash(userId, estimatedCost);
    } else if (type === OrderType.VENTE) {
      await this.walletsService.removeSecurities(userId, codeValeur, quantityRequested);
    } else {
      throw new BadRequestException("Type d'ordre invalide.");
    }

    const order = await this.prisma.order.create({
      data: {
        id: crypto.randomUUID(),
        userId,
        type,
        codeValeur,
        quantityRequested,
        priceRequested,
        status: OrderStatus.EN_ATTENTE,
        sgiPartenaireId: user.sgiPartenaire || "Société Générale Capital Securities",
        updatedAt: new Date(),
      },
    });

    return order;
  }

  async getMyOrders(userId: string) {
    return this.prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getAllOrders() {
    return this.prisma.order.findMany({
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

  async updateOrderStatus(orderId: string, status: OrderStatus, priceReal: number | null) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) {
      throw new NotFoundException("Ordre introuvable.");
    }

    if (order.status === OrderStatus.EXECUTE || order.status === OrderStatus.ANNULE) {
      throw new BadRequestException("Cet ordre est déjà finalisé.");
    }

    if (status === OrderStatus.EN_TRAITEMENT) {
      return this.prisma.order.update({
        where: { id: orderId },
        data: { 
          status,
          updatedAt: new Date()
        },
      });
    }

    if (status === OrderStatus.EXECUTE) {
      const finalPrice = priceReal && priceReal > 0 ? priceReal : order.priceRequested;

      if (order.type === OrderType.ACHAT) {
        const estimatedFrozen = order.quantityRequested * order.priceRequested * (1 + COMMISSION_RATE);
        const realCost = order.quantityRequested * finalPrice * (1 + COMMISSION_RATE);
        await this.walletsService.debitFrozenCash(order.userId, realCost, estimatedFrozen);
        await this.walletsService.addSecurities(order.userId, order.codeValeur, order.quantityRequested, finalPrice);
      } else if (order.type === OrderType.VENTE) {
        const realEarnings = order.quantityRequested * finalPrice * (1 - COMMISSION_RATE);
        await this.walletsService.depositCash(order.userId, realEarnings);
      }

      return this.prisma.order.update({
        where: { id: orderId },
        data: {
          status,
          priceReal: finalPrice,
          updatedAt: new Date(),
        },
      });
    }

    if (status === OrderStatus.ANNULE) {
      if (order.type === OrderType.ACHAT) {
        const estimatedFrozen = order.quantityRequested * order.priceRequested * (1 + COMMISSION_RATE);
        await this.walletsService.unfreezeCash(order.userId, estimatedFrozen);
      } else if (order.type === OrderType.VENTE) {
        await this.walletsService.addSecurities(order.userId, order.codeValeur, order.quantityRequested, order.priceRequested);
      }

      return this.prisma.order.update({
        where: { id: orderId },
        data: { 
          status,
          updatedAt: new Date(),
        },
      });
    }

    throw new BadRequestException("Statut d'ordre non supporté.");
  }
}
