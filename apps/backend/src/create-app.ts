import { NestFactory } from '@nestjs/core';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { json, urlencoded } from 'express';
import cookieParser = require('cookie-parser');
import { AppModule } from './app.module';
import { csrfMiddleware } from './common/middleware/csrf.middleware';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

export async function createApp(): Promise<INestApplication> {
  const app = await NestFactory.create(AppModule);

  // Augmenter la limite de taille du corps de requête JSON à 10 Mo
  // (permet l'envoi de logos en base64 et de jeux de données importants lors de l'onboarding)
  app.use(json({ limit: '10mb' }));
  app.use(urlencoded({ limit: '10mb', extended: true }));

  app.use(cookieParser());
  app.use(csrfMiddleware);

  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new LoggingInterceptor());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false, // Ignorer les champs supplémentaires non déclarés sans planter la requête
      transform: true,
    }),
  );

  const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:3000')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  app.enableCors({
    origin: (origin, callback) => {
      const isAllowed = !origin || allowedOrigins.includes(origin) || /\.vercel\.app$/.test(origin);
      callback(null, isAllowed);
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  app.setGlobalPrefix('api');
  return app;
}
