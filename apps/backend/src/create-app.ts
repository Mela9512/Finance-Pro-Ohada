import { NestFactory } from '@nestjs/core';
import { INestApplication, ValidationPipe } from '@nestjs/common';
// Import "= require(...)" plutôt que "import * as" : sur Vercel, le bundler serverless
// (esbuild) enveloppe différemment les modules CJS à export unique (module.exports = fn),
// et "import * as cookieParser" y devient un objet non-appelable au lieu de la fonction —
// crash "cookieParser n'est pas une fonction" constaté en production. Le style require()
// est sans ambiguïté quel que soit le bundler.
import cookieParser = require('cookie-parser');
import { AppModule } from './app.module';
import { csrfMiddleware } from './common/middleware/csrf.middleware';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

/**
 * Configuration Nest commune, utilisée à la fois par le serveur local (main.ts) et par le
 * handler serverless Vercel (api/index.ts). Les deux doivent rester rigoureusement identiques :
 * un écart entre les deux (CORS, CSRF, filtres...) est ce qui a cassé l'authentification lors
 * de la précédente tentative de déploiement serverless.
 */
export async function createApp(): Promise<INestApplication> {
  const app = await NestFactory.create(AppModule);

  app.use(cookieParser());
  app.use(csrfMiddleware);

  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new LoggingInterceptor());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // FRONTEND_URL accepte plusieurs origines séparées par des virgules : Vercel attribue parfois
  // plusieurs domaines *.vercel.app valides au même projet (alias historique + nom courant), et
  // exiger une seule valeur exacte cassait le CORS dès que l'un ne correspondait pas à l'autre.
  const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:3000')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`Origine non autorisée par CORS : ${origin}`), false);
      }
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  app.setGlobalPrefix('api');
  return app;
}
