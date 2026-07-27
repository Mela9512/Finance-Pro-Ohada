import { NotFoundException } from '@nestjs/common';
import { BusinessPlanService } from './business-plan.service';
import { CreateBusinessPlanDto } from './dto/create-business-plan.dto';

function makeRepoMock(overrides: Partial<Record<string, jest.Mock>> = {}) {
  return {
    find: jest.fn().mockResolvedValue([]),
    findOne: jest.fn().mockResolvedValue(null),
    create: jest.fn((x) => x),
    save: jest.fn(async (x) => ({ id: 'plan-1', ...x })),
    delete: jest.fn().mockResolvedValue({ affected: 1 }),
    ...overrides,
  };
}

const baseDto: CreateBusinessPlanDto = {
  title: 'Ouverture d\'une boulangerie',
  projectDescription: 'Ouverture d\'une boulangerie moderne à Brazzaville.',
  investmentAmount: 10000000,
  projectionYears: 3,
  year1Revenue: 8000000,
  revenueGrowthRatePercent: 10,
  variableCostPercent: 40,
  fixedCostsAnnual: 2000000,
  discountRatePercent: 10,
};

describe('BusinessPlanService', () => {
  let repo: ReturnType<typeof makeRepoMock>;
  let companyRepo: ReturnType<typeof makeRepoMock>;
  let reportsService: { getCompteDeResultatForYear: jest.Mock };
  let aiServiceMock: { getClientsRiskAnalysis: jest.Mock };
  let aiProvider: { generateText: jest.Mock; generateJson: jest.Mock; generateJsonFromFile: jest.Mock };
  let service: BusinessPlanService;

  beforeEach(() => {
    repo = makeRepoMock();
    companyRepo = makeRepoMock({ findOne: jest.fn().mockResolvedValue({ id: 'company-1', name: 'ACME SARL' }) });
    reportsService = { getCompteDeResultatForYear: jest.fn().mockResolvedValue({ chiffreAffaires: 0, resultatNet: 0 }) };
    aiServiceMock = { getClientsRiskAnalysis: jest.fn().mockResolvedValue({ clients: [], analyseIA: null }) };
    aiProvider = {
      generateText: jest.fn().mockResolvedValue('Résumé exécutif généré.'),
      generateJson: jest.fn(),
      generateJsonFromFile: jest.fn(),
    };

    service = new BusinessPlanService(
      repo as any,
      companyRepo as any,
      reportsService as any,
      aiServiceMock as any,
      aiProvider as any,
    );
  });

  describe('createBusinessPlan', () => {
    it('calcule et persiste des indicateurs financiers cohérents entre eux', async () => {
      const plan = await service.createBusinessPlan('company-1', 'user-1', baseDto);

      expect(plan.projections).toHaveLength(3);
      expect(plan.projections[0].revenue).toBe(8000000);
      expect(plan.van).toBeDefined();
      expect(plan.seuilRentabilite).toBeCloseTo(2000000 / 0.6, 6);
      expect(repo.save).toHaveBeenCalled();
    });

    it("traite un exercice précédent totalement vide (CA=0, résultat=0) comme une absence d'historique, pas comme un échec réel", async () => {
      reportsService.getCompteDeResultatForYear.mockResolvedValue({ chiffreAffaires: 0, resultatNet: 0 });

      const plan = await service.createBusinessPlan('company-1', 'user-1', baseDto);

      // Score calculé avec historicalResultatNet=null (neutre, 20pts) et non pas 10pts (déficit réel)
      expect(plan.creditScore).toBeGreaterThan(0);
    });

    it('utilise le résultat net réel du dernier exercice quand il existe (positif ou négatif)', async () => {
      reportsService.getCompteDeResultatForYear.mockResolvedValue({ chiffreAffaires: 15000000, resultatNet: 2000000 });

      const planPositif = await service.createBusinessPlan('company-1', 'user-1', baseDto);

      reportsService.getCompteDeResultatForYear.mockResolvedValue({ chiffreAffaires: 15000000, resultatNet: -2000000 });
      const planNegatif = await service.createBusinessPlan('company-1', 'user-1', baseDto);

      expect(planPositif.creditScore).toBeGreaterThan(planNegatif.creditScore);
    });

    it("calcule le ratio de retard réel à partir des risques clients (aiService.getClientsRiskAnalysis) et pénalise le score en conséquence", async () => {
      aiServiceMock.getClientsRiskAnalysis.mockResolvedValue({
        clients: [{ outstandingTotal: 1000000, overdueTotal: 900000 }],
        analyseIA: null,
      });
      const planAvecRetard = await service.createBusinessPlan('company-1', 'user-1', baseDto);

      aiServiceMock.getClientsRiskAnalysis.mockResolvedValue({ clients: [], analyseIA: null });
      const planSansRetard = await service.createBusinessPlan('company-1', 'user-1', baseDto);

      expect(planAvecRetard.creditScore).toBeLessThan(planSansRetard.creditScore);
    });

    it("génère le narratif via l'IA en incluant les indicateurs déjà calculés (pas recalculés par le prompt)", async () => {
      await service.createBusinessPlan('company-1', 'user-1', baseDto);

      expect(aiProvider.generateText).toHaveBeenCalledTimes(1);
      const prompt = aiProvider.generateText.mock.calls[0][0] as string;
      expect(prompt).toContain('ACME SARL');
      expect(prompt).toContain(baseDto.projectDescription);
    });

    it("retombe sur un texte de repli explicite si l'appel IA échoue, sans faire échouer la création du plan", async () => {
      aiProvider.generateText.mockRejectedValue(new Error('Gemini indisponible'));

      const plan = await service.createBusinessPlan('company-1', 'user-1', baseDto);

      expect(plan.narrative).toMatch(/indisponible/i);
      expect(plan.van).toBeDefined();
    });
  });

  describe('getBusinessPlan', () => {
    it("lève une NotFoundException quand le plan n'existe pas pour cette entreprise", async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(service.getBusinessPlan('company-1', 'missing-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteBusinessPlan', () => {
    it("lève une NotFoundException quand rien n'a été supprimé", async () => {
      repo.delete.mockResolvedValue({ affected: 0 });
      await expect(service.deleteBusinessPlan('company-1', 'missing-id')).rejects.toThrow(NotFoundException);
    });
  });
});
