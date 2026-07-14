import { Injectable, BadRequestException, InternalServerErrorException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InitiatePaymentDto } from './dto/initiate-payment.dto';
import { WaveTxStatus, WaveTxType } from '@prisma/client';
import axios from 'axios';
import * as crypto from 'crypto';

@Injectable()
export class WaveService {
  private readonly logger = new Logger(WaveService.name);
  private readonly apiUrl: string;
  private readonly apiKey: string;

  constructor(private prisma: PrismaService) {
    this.apiUrl = process.env.WAVE_API_URL || 'https://api.wave.com/v1';
    this.apiKey = process.env.WAVE_API_KEY || 'placeholder_wave_key';
  }

  async initiateDeposit(userId: string, dto: InitiatePaymentDto) {
    const { amount, phone } = dto;
    const idInternal = crypto.randomUUID();

    // 1. Créer la transaction locale
    await this.prisma.waveTransaction.create({
      data: {
        idInternal,
        userId,
        amount,
        type: WaveTxType.DEPOT,
        status: WaveTxStatus.EN_COURS,
        updatedAt: new Date(),
      },
    });

    const clientAppUrl = process.env.CLIENT_APP_URL || 'http://localhost:8080';
    const endpoint = `${this.apiUrl}/checkout/sessions`;
    const payload = {
      amount: amount.toString(),
      currency: 'XOF',
      error_url: `${clientAppUrl}/dashboard?status=error`,
      success_url: `${clientAppUrl}/dashboard?status=success`,
      client_reference: idInternal,
    };

    try {
      this.logger.log(`Initiation dépôt Wave Business (Lien Statique) pour l'utilisateur ${userId}, montant ${amount}`);
      
      const waveMerchantUrl = 'https://pay.wave.com/m/M_ci_XRkfDq_9M8GP/c/ci/?src=p';

      // Mettre à jour la transaction locale avec l'URL de dépôt
      await this.prisma.waveTransaction.update({
        where: { idInternal },
        data: {
          waveSessionId: idInternal,
          updatedAt: new Date(),
        },
      });

      await this.prisma.auditLog.create({
        data: {
          userId,
          action: 'TX_DEPOSIT_INITIATED',
          details: `Dépôt Wave initié: ${idInternal}, montant: ${amount}`,
          ipAddress: '127.0.0.1',
        },
      });

      return {
        idInternal,
        waveSessionId: idInternal,
        status: 'PENDING',
        redirectUrl: waveMerchantUrl,
      };
    } catch (error: any) {
      this.logger.error(`Erreur initiation dépôt Wave Business: ${error.message}`);
      
      // Mettre à jour le statut de la transaction locale en ECHEC
      await this.prisma.waveTransaction.update({
        where: { idInternal },
        data: {
          status: WaveTxStatus.ECHEC,
          updatedAt: new Date(),
        },
      });

      throw new InternalServerErrorException('Erreur lors de l\'initialisation du paiement Wave');
    }
  }

  async initiateWithdrawal(userId: string, dto: InitiatePaymentDto) {
    const { amount, phone } = dto;
    const idInternal = crypto.randomUUID();

    // 1. Vérifier si le solde du CashWallet est suffisant
    const wallet = await this.prisma.cashWallet.findUnique({
      where: { userId },
    });

    if (!wallet || wallet.balanceTotal < amount) {
      throw new BadRequestException('Solde insuffisant pour effectuer ce retrait');
    }

    // 2. Créer la transaction locale et geler les fonds (transaction DB)
    await this.prisma.$transaction(async (tx) => {
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

      return tx.waveTransaction.create({
        data: {
          idInternal,
          userId,
          amount,
          type: WaveTxType.RETRAIT,
          status: WaveTxStatus.EN_COURS,
          updatedAt: new Date(),
        },
      });
    });

    const endpoint = `${this.apiUrl}/disbursements`;
    const payload = {
      amount: amount.toString(),
      currency: 'XOF',
      recipient_mobile: phone,
      client_reference: idInternal,
    };

    try {
      this.logger.log(`Initiation retrait Wave Business pour l'utilisateur ${userId}, montant ${amount}`);
      
      let responseData;
      if (!this.apiKey || this.apiKey.includes('placeholder') || this.apiKey.includes('test')) {
        this.logger.warn('Clé API Wave non configurée. Simulation du succès de l\'appel API.');
        
        const simDisbId = `wave_disb_${crypto.randomBytes(8).toString('hex')}`;
        responseData = {
          id: simDisbId,
          status: 'succeeded'
        };

        // Déclencher le webhook de succès asynchrone après 1,5 seconde
        setTimeout(async () => {
          try {
            await this.handleWebhook('simulated-signature', {
              type: 'disbursement.succeeded',
              data: {
                id: simDisbId,
                client_reference: idInternal
              }
            });
          } catch (e: any) {
            this.logger.error(`Erreur validation simulation retrait: ${e.message}`);
          }
        }, 1500);

      } else {
        const response = await axios.post(endpoint, payload, {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        });
        responseData = response.data;
      }

      // Si le retrait réussit immédiatement (certaines APIs Wave valident les disbursements de suite)
      let finalStatus: WaveTxStatus = WaveTxStatus.EN_COURS;
      if (responseData.status === 'succeeded') {
        finalStatus = WaveTxStatus.SUCCES;
        
        // Confirmer le retrait : libérer les fonds gelés
        await this.prisma.$transaction(async (tx) => {
          await tx.cashWallet.update({
            where: { userId },
            data: {
              balanceFrozen: { decrement: amount },
            },
          });
        });
      }

      await this.prisma.waveTransaction.update({
        where: { idInternal },
        data: {
          wavePaymentId: responseData.id || idInternal,
          status: finalStatus,
          updatedAt: new Date(),
        },
      });

      await this.prisma.auditLog.create({
        data: {
          userId,
          action: 'TX_WITHDRAWAL_INITIATED',
          details: `Retrait Wave initié: ${idInternal}, montant: ${amount}, statut: ${finalStatus}`,
          ipAddress: '127.0.0.1',
        },
      });

      return {
        idInternal,
        wavePaymentId: responseData.id || idInternal,
        status: finalStatus === WaveTxStatus.SUCCES ? 'SUCCESS' : 'PENDING',
      };
    } catch (error: any) {
      this.logger.error(`Erreur initiation retrait Wave Business: ${error.message}`);
      
      // Rembourser l'utilisateur en cas d'échec API immédiat
      await this.prisma.$transaction(async (tx) => {
        await tx.cashWallet.update({
          where: { userId },
          data: {
            balanceTotal: { increment: amount },
            balanceFrozen: { decrement: amount },
          },
        });

        await tx.waveTransaction.update({
          where: { idInternal },
          data: {
            status: WaveTxStatus.ECHEC,
            updatedAt: new Date(),
          },
        });
      });

      throw new InternalServerErrorException('Erreur lors de l\'initialisation du retrait chez Wave');
    }
  }

  async handleWebhook(signature: string | undefined, payload: any) {
    this.logger.log(`Webhook reçu de Wave Business. Type: ${payload.type}`);

    // Dans Wave, l'événement de succès de paiement est 'checkout.session.completed'
    if (payload.type === 'checkout.session.completed') {
      const session = payload.data;
      const idInternal = session.client_reference;

      const transaction = await this.prisma.waveTransaction.findUnique({
        where: { idInternal },
      });

      if (!transaction) {
        this.logger.warn(`Transaction introuvable pour la référence : ${idInternal}`);
        return { status: 'NOT_FOUND' };
      }

      if (transaction.status !== WaveTxStatus.EN_COURS) {
        this.logger.log(`La transaction ${idInternal} est déjà traitée.`);
        return { status: 'ALREADY_PROCESSED' };
      }

      if (session.status === 'succeeded') {
        // Créditer le portefeuille cash
        await this.prisma.$transaction(async (tx) => {
          let wallet = await tx.cashWallet.findUnique({ where: { userId: transaction.userId } });
          if (!wallet) {
            wallet = await tx.cashWallet.create({
              data: {
                id: `wallet_${transaction.userId.slice(0, 8)}_${Date.now().toString().slice(-6)}`,
                userId: transaction.userId,
                balanceTotal: 0.0,
                balanceFrozen: 0.0,
                currency: 'XOF',
                updatedAt: new Date(),
              },
            });
          }

          await tx.cashWallet.update({
            where: { userId: transaction.userId },
            data: {
              balanceTotal: { increment: transaction.amount },
              updatedAt: new Date(),
            },
          });

          await tx.waveTransaction.update({
            where: { idInternal },
            data: {
              status: WaveTxStatus.SUCCES,
              wavePaymentId: session.id,
              webhookSignature: signature || 'simulated',
              updatedAt: new Date(),
            },
          });
        });

        this.logger.log(`Dépôt Wave validé pour la transaction ${idInternal}. Portefeuille crédité de ${transaction.amount} F.`);
      } else {
        // Échec de la session de paiement
        await this.prisma.waveTransaction.update({
          where: { idInternal },
          data: {
            status: WaveTxStatus.ECHEC,
            webhookSignature: signature || 'simulated',
            updatedAt: new Date(),
          },
        });
        this.logger.log(`Dépôt Wave échoué pour la transaction ${idInternal}.`);
      }
    }

    // Gestion des payouts (retraits)
    if (payload.type === 'disbursement.succeeded' || payload.type === 'disbursement.failed') {
      const disbursement = payload.data;
      const idInternal = disbursement.client_reference;

      const transaction = await this.prisma.waveTransaction.findUnique({
        where: { idInternal },
      });

      if (transaction && transaction.status === WaveTxStatus.EN_COURS) {
        if (payload.type === 'disbursement.succeeded') {
          await this.prisma.$transaction(async (tx) => {
            await tx.cashWallet.update({
              where: { userId: transaction.userId },
              data: {
                balanceFrozen: { decrement: transaction.amount },
              },
            });

            await tx.waveTransaction.update({
              where: { idInternal },
              data: {
                status: WaveTxStatus.SUCCES,
                webhookSignature: signature || 'simulated',
                updatedAt: new Date(),
              },
            });
          });
          this.logger.log(`Retrait Wave validé pour la transaction ${idInternal}.`);
        } else {
          // Rembourser l'utilisateur
          await this.prisma.$transaction(async (tx) => {
            await tx.cashWallet.update({
              where: { userId: transaction.userId },
              data: {
                balanceTotal: { increment: transaction.amount },
                balanceFrozen: { decrement: transaction.amount },
              },
            });

            await tx.waveTransaction.update({
              where: { idInternal },
              data: {
                status: WaveTxStatus.ECHEC,
                webhookSignature: signature || 'simulated',
                updatedAt: new Date(),
              },
            });
          });
          this.logger.log(`Retrait Wave échoué pour la transaction ${idInternal}. Fonds remboursés.`);
        }
      }
    }

    return { status: 'PROCESSED' };
  }
}
