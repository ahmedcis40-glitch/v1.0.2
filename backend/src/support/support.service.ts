import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SupportService {
  constructor(private prisma: PrismaService) {}

  async getLogs() {
    return this.prisma.systemLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100, // Limiter aux 100 derniers logs pour de meilleures performances
    });
  }

  async createLog(level: string, message: string, stack?: string, context?: string) {
    return this.prisma.systemLog.create({
      data: {
        level: level || 'ERROR',
        message: message || 'No message provided',
        stack: stack || null,
        context: context || 'ClientPortal',
      },
    });
  }
}
