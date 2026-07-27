import 'reflect-metadata';
import { INestApplication } from '@nestjs/common';
import { createApp } from '../src/create-app';

// Le conteneur Lambda Vercel peut être réutilisé ("warm") entre invocations : on cache la
// promesse d'initialisation pour ne jamais recréer l'app Nest (donc le pool de connexions
// TypeORM) à chaque requête, ce qui saturerait le pooler Supabase en quelques appels.
let appPromise: Promise<INestApplication> | null = null;

function getApp(): Promise<INestApplication> {
  if (!appPromise) {
    appPromise = createApp().then(async (app) => {
      await app.init();
      return app;
    });
  }
  return appPromise;
}

export default async function handler(req: any, res: any) {
  const app = await getApp();
  const expressInstance = app.getHttpAdapter().getInstance();
  expressInstance(req, res);
}
