import { createApp } from './create-app';

async function bootstrap() {
  const app = await createApp();
  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`🚀 Serveur Backend FinancePro OHADA lancé sur http://localhost:${port}/api`);
}
bootstrap();
