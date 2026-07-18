import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { PrismaService } from '../../prisma/prisma.service';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('AllExceptionsFilter');

  constructor(
    private readonly httpAdapterHost: HttpAdapterHost,
    private readonly prisma: PrismaService,
  ) {}

  catch(exception: any, host: ArgumentsHost): void {
    const { httpAdapter } = this.httpAdapterHost;
    const ctx = host.switchToHttp();

    const httpStatus =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message = exception instanceof Error ? exception.message : 'Unknown error';
    const stack = exception instanceof Error ? exception.stack : null;

    // Sauvegarder le log dans la table SystemLog de manière asynchrone (non-bloquante)
    this.prisma.systemLog.create({
      data: {
        level: httpStatus >= 500 ? 'ERROR' : 'WARN',
        message: message,
        stack: stack,
        context: 'HttpServer',
      },
    }).catch(err => {
      this.logger.error(`Impossible de sauvegarder le log d'erreur en base: ${err.message}`);
    });

    // Émettre le log dans la console standard du serveur
    if (httpStatus >= 500) {
      this.logger.error(`[500 Internal Error] ${message}`, stack);
    } else {
      this.logger.warn(`[${httpStatus} Warning] Path: ${httpAdapter.getRequestUrl(ctx.getRequest())} - ${message}`);
    }

    const responseBody = {
      statusCode: httpStatus,
      timestamp: new Date().toISOString(),
      path: httpAdapter.getRequestUrl(ctx.getRequest()),
      message: httpStatus >= 550 ? 'Une erreur interne est survenue' : message,
    };

    httpAdapter.reply(ctx.getResponse(), responseBody, httpStatus);
  }
}
