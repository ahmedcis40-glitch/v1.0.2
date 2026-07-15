// Developer signature: ahdahmed45591@gmail.com
import { NestFactory, HttpAdapterHost } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { PrismaService } from './prisma/prisma.service';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

import { json, urlencoded } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Augmenter la taille limite du corps de la requete pour accepter le Base64 du KYC
  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ limit: '50mb', extended: true }));

  // Sécuriser les en-têtes HTTP
  app.use(helmet());

  // Activer CORS pour permettre les requêtes depuis les frontends
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Pipe global pour la validation des inputs (DTOs)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  // Filtre d'exceptions global pour la journalisation des erreurs en base de données
  const httpAdapterHost = app.get(HttpAdapterHost);
  const prismaService = app.get(PrismaService);
  app.useGlobalFilters(new AllExceptionsFilter(httpAdapterHost, prismaService));

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`Application démarrée sur le port ${port}`);
}
bootstrap();
