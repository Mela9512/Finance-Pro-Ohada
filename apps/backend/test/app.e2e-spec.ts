import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import * as cookieParser from 'cookie-parser';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppModule } from '../src/app.module';
import { csrfMiddleware } from '../src/common/middleware/csrf.middleware';
import { AllExceptionsFilter } from '../src/common/filters/all-exceptions.filter';
import { UserEntity } from '../src/entities/user.entity';
import { CompanyEntity } from '../src/entities/company.entity';
import * as bcrypt from 'bcryptjs';

const TEST_EMAIL = `e2e-${Date.now()}@example.test`;
const TEST_COMPANY = `E2E TEST CO ${Date.now()}`;
const TEST_PASSWORD = 'MotDePasseE2E123';

// Chaque test peut enchaîner plusieurs allers-retours HTTP réels vers une base
// Supabase distante ; le timeout par défaut de Jest (5000ms) est trop court.
jest.setTimeout(30000);

describe('FinancePro OHADA (e2e)', () => {
  let app: INestApplication;
  let adminCookie: string[];
  let csrfToken: string;
  let companyId: string;
  let comptableCookie: string[];

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.use(cookieParser());
    app.use(csrfMiddleware);
    app.useGlobalFilters(new AllExceptionsFilter());
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    app.setGlobalPrefix('api');
    await app.init();
  });

  afterAll(async () => {
    // Nettoyage : supprime toutes les traces du tenant de test créé pendant la suite.
    const userRepo = app.get<Repository<UserEntity>>(getRepositoryToken(UserEntity));
    const companyRepo = app.get<Repository<CompanyEntity>>(getRepositoryToken(CompanyEntity));
    if (companyId) {
      await userRepo.delete({ companyId });
      await companyRepo.delete({ id: companyId });
    }
    await app.close();
  });

  function extractCookie(res: request.Response): string[] {
    return res.headers['set-cookie'] as unknown as string[];
  }

  it('rejette une requête sur une route protégée sans cookie de session', async () => {
    await request(app.getHttpServer()).get('/api/clients').expect(401);
  });

  it('POST /api/auth/register crée un tenant isolé et pose un cookie de session', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ name: 'E2E Admin', email: TEST_EMAIL, password: TEST_PASSWORD, companyName: TEST_COMPANY })
      .expect(201);

    expect(res.body.user.role).toBe('ADMIN');
    expect(res.body.company.name).toBe(TEST_COMPANY);
    companyId = res.body.company.id;
    adminCookie = extractCookie(res);
    expect(adminCookie.some((c) => c.startsWith('access_token='))).toBe(true);
  });

  it('rejette une seconde inscription avec le même email (409)', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ name: 'Doublon', email: TEST_EMAIL, password: TEST_PASSWORD, companyName: 'AUTRE SOCIETE' })
      .expect(409);
  });

  it('rejette une connexion avec un mauvais mot de passe (401)', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: TEST_EMAIL, password: 'MauvaisMotDePasse1' })
      .expect(401);
  });

  it('isole les données du nouveau tenant : /api/clients est vide', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/clients')
      .set('Cookie', adminCookie)
      .expect(200);
    expect(res.body).toEqual([]);
  });

  it('récupère un jeton CSRF pour les requêtes mutantes', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/auth/csrf-token')
      .set('Cookie', adminCookie)
      .expect(200);
    csrfToken = res.body.csrfToken;
    // Le schéma double-submit exige le cookie csrf_token ET le header sur les requêtes
    // suivantes : on fusionne le nouveau cookie avec la session déjà établie.
    adminCookie = [...adminCookie, ...extractCookie(res)];
    expect(typeof csrfToken).toBe('string');
  });

  it('rejette une requête mutante sans jeton CSRF (403)', async () => {
    await request(app.getHttpServer())
      .post('/api/clients')
      .set('Cookie', adminCookie)
      .send({ name: 'X', phone: 'x', email: 'x@x.cg', address: 'x', creditLimit: 1 })
      .expect(403);
  });

  describe('cycle comptable complet', () => {
    it('crée un client, une écriture équilibrée, et les retrouve dans le Grand Livre + Bilan', async () => {
      await request(app.getHttpServer())
        .post('/api/clients')
        .set('Cookie', adminCookie)
        .set('X-CSRF-Token', csrfToken)
        .send({ name: 'CLIENT E2E', phone: '+242000000', email: 'client@e2e.test', address: 'Test', creditLimit: 5000000 })
        .expect(201);

      const entryRes = await request(app.getHttpServer())
        .post('/api/accounting/entries')
        .set('Cookie', adminCookie)
        .set('X-CSRF-Token', csrfToken)
        .send({
          date: '2026-01-20',
          journalType: 'VENTES',
          wording: 'Vente E2E',
          pieceNumber: 'FAC-E2E-1',
          lines: [
            { accountCode: '411', accountLabel: 'Clients', debit: 118000, credit: 0 },
            { accountCode: '701', accountLabel: 'Ventes', debit: 0, credit: 100000 },
            { accountCode: '443', accountLabel: 'TVA', debit: 0, credit: 18000 },
          ],
        })
        .expect(201);

      expect(entryRes.body.entryNumber).toMatch(/^VT-\d{4}-\d{4}$/);

      const grandLivreRes = await request(app.getHttpServer())
        .get('/api/accounting/grand-livre?accountCode=411')
        .set('Cookie', adminCookie)
        .expect(200);
      expect(grandLivreRes.body.length).toBeGreaterThanOrEqual(1);

      const bilanRes = await request(app.getHttpServer())
        .get('/api/reports/bilan')
        .set('Cookie', adminCookie)
        .expect(200);
      expect(bilanRes.body.actif.totalActif).toBeCloseTo(bilanRes.body.passif.totalPassif, 6);

      const crRes = await request(app.getHttpServer())
        .get('/api/reports/compte-resultat')
        .set('Cookie', adminCookie)
        .expect(200);
      expect(crRes.body.chiffreAffaires).toBe(100000);
    });

    it('rejette une écriture déséquilibrée (400)', async () => {
      await request(app.getHttpServer())
        .post('/api/accounting/entries')
        .set('Cookie', adminCookie)
        .set('X-CSRF-Token', csrfToken)
        .send({
          date: '2026-01-20',
          journalType: 'OD',
          wording: 'Déséquilibrée',
          pieceNumber: 'X',
          lines: [
            { accountCode: '601', accountLabel: 'Achats', debit: 1000, credit: 0 },
            { accountCode: '401', accountLabel: 'Fournisseurs', debit: 0, credit: 500 },
          ],
        })
        .expect(400);
    });
  });

  describe('RBAC', () => {
    beforeAll(async () => {
      // Crée directement un second utilisateur COMPTABLE dans le même tenant (sans passer par l'email d'invitation).
      const userRepo = app.get<Repository<UserEntity>>(getRepositoryToken(UserEntity));
      const passwordHash = await bcrypt.hash(TEST_PASSWORD, 10);
      const comptableEmail = `comptable-${Date.now()}@example.test`;
      await userRepo.save(
        userRepo.create({
          email: comptableEmail,
          passwordHash,
          name: 'E2E Comptable',
          role: 'COMPTABLE',
          companyId,
        }),
      );
      const loginRes = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: comptableEmail, password: TEST_PASSWORD })
        .expect(200);
      comptableCookie = extractCookie(loginRes);
    });

    it('refuse à un COMPTABLE l\'accès aux routes réservées ADMIN (403)', async () => {
      await request(app.getHttpServer())
        .get('/api/admin/users')
        .set('Cookie', comptableCookie)
        .expect(403);
    });

    it('autorise un COMPTABLE à consulter le Bilan (lecture non restreinte)', async () => {
      await request(app.getHttpServer())
        .get('/api/reports/bilan')
        .set('Cookie', comptableCookie)
        .expect(200);
    });
  });
});
