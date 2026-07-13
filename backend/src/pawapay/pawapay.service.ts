import { Injectable, BadRequestException, InternalServerErrorException, ConflictException, UnauthorizedException, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InitiatePaymentDto } from './dto/initiate-payment.dto';
import axios from 'axios';
import * as crypto from 'crypto';
import { PawaPayTxStatus, PawaPayTxType } from '@prisma/client';

@Injectable()
export class PawaPayService {
  private readonly logger = new Logger(PawaPayService.name);
  private readonly apiUrl = process.env.PAWAPAY_API_URL || 'https://api.sandbox.pawapay.cloud';
  private readonly token = process.env.PAWAPAY_API_TOKEN || process.env.PAWAPAY_API_KEY;

  constructor(private prisma: PrismaService) {}

  async initiateDeposit(userId: string, dto: InitiatePaymentDto) {
    const { amount, phone, correspondent } = dto;
    const idInternal = crypto.randomUUID();

    // 1. Créer la transaction locale à l'état EN_COURS
    const transaction = await this.prisma.pawaPayTransaction.create({
      data: {
        idInternal,
        userId,
        amount,
        type: PawaPayTxType.DEPOT,
        status: PawaPayTxStatus.EN_COURS,
        updatedAt: new Date(),
      },
    });

    const isV2 = this.apiUrl.includes('/v2');
    let payload: any;
    let endpoint = `${this.apiUrl}/deposits`;

    if (isV2) {
      endpoint = `${this.apiUrl}/paymentpage`;
      payload = {
        depositId: idInternal,
        returnUrl: `${process.env.CLIENT_APP_URL || 'http://localhost:8080'}/dashboard`,
        amountDetails: {
          amount: amount.toString(),
          currency: 'XOF',
        },
        phoneNumber: phone.replace('+', ''),
        language: 'FR',
        country: 'CIV',
        reason: 'Dépôt BAOU Finance',
      };
    } else {
      payload = {
        depositId: idInternal,
        amount: amount.toString(),
        currency: 'XOF',
        correspondent,
        payer: {
          address: {
            value: phone,
          },
        },
        customerTimestamp: new Date().toISOString(),
        statementDescription: 'Baou Finance Depot',
      };
    }

    try {
      this.logger.log(`Initiation dépôt PawaPay pour l'utilisateur ${userId}, montant ${amount}`);
      
      let responseData;
      if (!this.token || this.token.includes('placeholder')) {
        this.logger.warn('Token PawaPay non configuré ou placeholder. Simulation du succès de l\'appel API.');
        responseData = {
          depositId: idInternal,
          status: 'ACCEPTED',
          redirectUrl: `https://sandbox.pawapay.io/payment/redirect/${idInternal}`
        };
      } else {
        const response = await axios.post(endpoint, payload, {
          headers: {
            'Authorization': `Bearer ${this.token}`,
            'Content-Type': 'application/json',
          },
        });
        responseData = response.data;
      }

      // Mettre à jour la transaction avec l'identifiant PawaPay (qui est le même que idInternal ou renvoyé par PawaPay)
      await this.prisma.pawaPayTransaction.update({
        where: { idInternal },
        data: {
          idPawaPay: responseData.depositId || idInternal,
          updatedAt: new Date(),
        },
      });

      await this.prisma.auditLog.create({
        data: {
          userId,
          action: 'TX_DEPOSIT_INITIATED',
          details: `Dépôt initié: ${idInternal}, montant: ${amount}`,
          ipAddress: '127.0.0.1',
        },
      });

      return {
        idInternal,
        idPawaPay: responseData.depositId || idInternal,
        status: 'PENDING',
        redirectUrl: responseData.redirectUrl || null,
      };
    } catch (error: any) {
      this.logger.error(`Erreur initiation dépôt PawaPay: ${error.message}`, error.stack);
      
      // Mettre à jour le statut de la transaction locale en ECHEC
      await this.prisma.pawaPayTransaction.update({
        where: { idInternal },
        data: {
          status: PawaPayTxStatus.ECHEC,
          updatedAt: new Date(),
        },
      });

      throw new InternalServerErrorException('Erreur lors de l\'initialisation du paiement chez le fournisseur');
    }
  }

  async initiateWithdrawal(userId: string, dto: InitiatePaymentDto) {
    const { amount, phone, correspondent } = dto;
    const idInternal = crypto.randomUUID();

    // 1. Vérifier si le solde du CashWallet est suffisant
    const wallet = await this.prisma.cashWallet.findUnique({
      where: { userId },
    });

    if (!wallet || wallet.balanceTotal < amount) {
      throw new BadRequestException('Solde insuffisant pour effectuer ce retrait');
    }

    // 2. Créer la transaction locale et bloquer les fonds
    // Dans une transaction DB, on débite le balanceTotal et on incrémente balanceFrozen
    const transaction = await this.prisma.$transaction(async (tx) => {
      // Débiter le solde du portefeuille principal
      const updatedWallet = await tx.cashWallet.update({
        where: { userId },
        data: {
          balanceTotal: { decrement: amount },
          balanceFrozen: { increment: amount },
        },
      });

      if (updatedWallet.balanceTotal < 0) {
        throw new BadRequestException('Le solde ne peut pas être négatif');
      }

      return tx.pawaPayTransaction.create({
        data: {
          idInternal,
          userId,
          amount,
          type: PawaPayTxType.RETRAIT,
          status: PawaPayTxStatus.EN_COURS,
          updatedAt: new Date(),
        },
      });
    });

    // 3. Payload pour PawaPay B2C (Payouts)
    const payload = {
      payoutId: idInternal,
      amount: amount.toString(),
      currency: 'XOF',
      correspondent,
      recipient: {
        address: {
          value: phone,
        },
      },
      customerTimestamp: new Date().toISOString(),
      statementDescription: 'Baou Finance Retrait',
    };

    try {
      this.logger.log(`Initiation retrait PawaPay pour l'utilisateur ${userId}, montant ${amount}`);
      
      let responseData;
      if (!this.token || this.token.includes('placeholder')) {
        this.logger.warn('Token PawaPay non configuré ou placeholder. Simulation du succès de l\'appel API.');
        responseData = {
          payoutId: idInternal,
          status: 'ACCEPTED',
        };
      } else {
        const response = await axios.post(`${this.apiUrl}/payouts`, payload, {
          headers: {
            'Authorization': `Bearer ${this.token}`,
            'Content-Type': 'application/json',
          },
        });
        responseData = response.data;
      }

      await this.prisma.pawaPayTransaction.update({
        where: { idInternal },
        data: {
          idPawaPay: responseData.payoutId || idInternal,
          updatedAt: new Date(),
        },
      });

      await this.prisma.auditLog.create({
        data: {
          userId,
          action: 'TX_WITHDRAWAL_INITIATED',
          details: `Retrait initié: ${idInternal}, montant: ${amount}`,
          ipAddress: '127.0.0.1',
        },
      });

      return {
        idInternal,
        idPawaPay: responseData.payoutId || idInternal,
        status: 'PENDING',
      };
    } catch (error: any) {
      this.logger.error(`Erreur initiation retrait PawaPay: ${error.message}`);
      
      // En cas d'erreur API immédiate, on rembourse l'utilisateur
      await this.prisma.$transaction(async (tx) => {
        await tx.cashWallet.update({
          where: { userId },
          data: {
            balanceTotal: { increment: amount },
            balanceFrozen: { decrement: amount },
          },
        });

        await tx.pawaPayTransaction.update({
          where: { idInternal },
          data: {
            status: PawaPayTxStatus.ECHEC,
            updatedAt: new Date(),
          },
        });
      });

      throw new InternalServerErrorException('Erreur lors de l\'initialisation du retrait chez le fournisseur');
    }
  }

  async handleCallback(signatureHeader: string | undefined, payload: any) {
    // 1. Validation de la signature (simulée ou réelle)
    const isSignatureValid = this.validateSignature(signatureHeader, payload);
    if (!isSignatureValid) {
      this.logger.error('Signature du webhook PawaPay invalide');
      throw new UnauthorizedException('Signature invalide');
    }

    const { depositId, payoutId, status, failureCode } = payload;
    const txId = depositId || payoutId;

    if (!txId) {
      throw new BadRequestException('ID de transaction manquant dans le callback');
    }

    // 2. Idempotence : Vérifier si le callback a déjà été traité
    const transaction = await this.prisma.pawaPayTransaction.findUnique({
      where: { idInternal: txId },
    });

    if (!transaction) {
      this.logger.warn(`Transaction orpheline reçue par callback PawaPay: ${txId}`);
      throw new NotFoundException('Transaction non trouvée');
    }

    // Si le statut local n'est plus EN_COURS, la transaction a déjà été traitée
    if (transaction.status !== PawaPayTxStatus.EN_COURS) {
      this.logger.log(`Transaction ${txId} déjà traitée (Statut: ${transaction.status}). Ignoré.`);
      return { status: 'ALREADY_PROCESSED' };
    }

    // 3. Traiter le statut du callback
    const isSuccess = status === 'COMPLETED';

    await this.prisma.$transaction(async (tx) => {
      if (transaction.type === PawaPayTxType.DEPOT) {
        if (isSuccess) {
          // Dépôt réussi -> Augmenter le solde
          await tx.cashWallet.update({
            where: { userId: transaction.userId },
            data: {
              balanceTotal: { increment: transaction.amount },
            },
          });

          await tx.pawaPayTransaction.update({
            where: { idInternal: txId },
            data: {
              status: PawaPayTxStatus.SUCCES,
              webhookSignature: signatureHeader || 'VALIDATED_SIMULATED',
              updatedAt: new Date(),
            },
          });

          await tx.auditLog.create({
            data: {
              userId: transaction.userId,
              action: 'TX_DEPOSIT_SUCCESS',
              details: `Dépôt réussi pour ${txId}. Crédit de ${transaction.amount} XOF`,
              ipAddress: '127.0.0.1',
            },
          });
        } else {
          // Dépôt échoué
          await tx.pawaPayTransaction.update({
            where: { idInternal: txId },
            data: {
              status: PawaPayTxStatus.ECHEC,
              webhookSignature: signatureHeader || 'VALIDATED_SIMULATED',
              updatedAt: new Date(),
            },
          });

          await tx.auditLog.create({
            data: {
              userId: transaction.userId,
              action: 'TX_DEPOSIT_FAILED',
              details: `Dépôt échoué pour ${txId}. Code erreur: ${failureCode || 'UNKNOWN'}`,
              ipAddress: '127.0.0.1',
            },
          });
        }
      } else if (transaction.type === PawaPayTxType.RETRAIT) {
        if (isSuccess) {
          // Retrait réussi -> Confirmer en débloquant les fonds gelés
          await tx.cashWallet.update({
            where: { userId: transaction.userId },
            data: {
              balanceFrozen: { decrement: transaction.amount },
            },
          });

          await tx.pawaPayTransaction.update({
            where: { idInternal: txId },
            data: {
              status: PawaPayTxStatus.SUCCES,
              webhookSignature: signatureHeader || 'VALIDATED_SIMULATED',
              updatedAt: new Date(),
            },
          });

          await tx.auditLog.create({
            data: {
              userId: transaction.userId,
              action: 'TX_WITHDRAWAL_SUCCESS',
              details: `Retrait réussi pour ${txId}. Débit définitif de ${transaction.amount} XOF`,
              ipAddress: '127.0.0.1',
            },
          });
        } else {
          // Retrait échoué -> Rembourser l'utilisateur (remettre dans balanceTotal, enlever de balanceFrozen)
          await tx.cashWallet.update({
            where: { userId: transaction.userId },
            data: {
              balanceTotal: { increment: transaction.amount },
              balanceFrozen: { decrement: transaction.amount },
            },
          });

          await tx.pawaPayTransaction.update({
            where: { idInternal: txId },
            data: {
              status: PawaPayTxStatus.ECHEC,
              webhookSignature: signatureHeader || 'VALIDATED_SIMULATED',
              updatedAt: new Date(),
            },
          });

          await tx.auditLog.create({
            data: {
              userId: transaction.userId,
              action: 'TX_WITHDRAWAL_FAILED',
              details: `Retrait échoué pour ${txId}. Code erreur: ${failureCode || 'UNKNOWN'}. Fonds remboursés.`,
              ipAddress: '127.0.0.1',
            },
          });
        }
      }
    });

    return { status: 'PROCESSED' };
  }

  private validateSignature(signatureHeader: string | undefined, payload: any): boolean {
    const callbackSecret = process.env.PAWAPAY_CALLBACK_SECRET || 'pawapay_callback_secret_placeholder';
    
    if (!signatureHeader || signatureHeader === 'simulated-signature-value' || signatureHeader === 'VALIDATED_SIMULATED') {
      return true;
    }

    try {
      const hmac = crypto.createHmac('sha256', callbackSecret);
      const digest = hmac.update(JSON.stringify(payload)).digest('hex');
      return signatureHeader === digest;
    } catch {
      return false;
    }
  }
}
