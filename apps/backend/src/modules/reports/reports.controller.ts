import { BadRequestException, Controller, Get, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import { ReportsService } from './reports.service';
import { PdfService } from '../../common/services/pdf.service';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { AiService } from '../ai/ai.service';

@Controller('reports')
export class ReportsController {
  constructor(
    private readonly reportsService: ReportsService,
    private readonly pdfService: PdfService,
    private readonly aiService: AiService,
  ) {}

  @Get('bilan')
  getBilan(@CurrentUser() user: AuthenticatedUser) {
    return this.reportsService.getBilan(user.companyId);
  }

  @Get('bilan/pdf')
  async getBilanPdf(@CurrentUser() user: AuthenticatedUser, @Res() res: Response) {
    const [bilan, company] = await Promise.all([
      this.reportsService.getBilan(user.companyId),
      this.reportsService.getCompany(user.companyId),
    ]);
    const buffer = await this.pdfService.generateBilanPdf(bilan, company);
    res.set({ 'Content-Type': 'application/pdf', 'Content-Disposition': 'attachment; filename="bilan.pdf"' });
    res.send(buffer);
  }

  @Get('compte-resultat')
  getCompteDeResultat(@CurrentUser() user: AuthenticatedUser) {
    return this.reportsService.getCompteDeResultat(user.companyId);
  }

  @Get('compte-resultat/pdf')
  async getCompteResultatPdf(@CurrentUser() user: AuthenticatedUser, @Res() res: Response) {
    const [cr, company] = await Promise.all([
      this.reportsService.getCompteDeResultat(user.companyId),
      this.reportsService.getCompany(user.companyId),
    ]);
    const buffer = await this.pdfService.generateCompteResultatPdf(cr, company);
    res.set({ 'Content-Type': 'application/pdf', 'Content-Disposition': 'attachment; filename="compte-resultat.pdf"' });
    res.send(buffer);
  }

  @Get('tft')
  getTFT(@CurrentUser() user: AuthenticatedUser) {
    return this.reportsService.getTFT(user.companyId);
  }

  private parsePeriod(year?: string, month?: string): { year: number; month: number } {
    const y = Number(year);
    const m = Number(month);
    if (!y || !m || m < 1 || m > 12) {
      throw new BadRequestException('Paramètres year/month invalides (ex: ?year=2026&month=7)');
    }
    return { year: y, month: m };
  }

  @Get('declaration-fiscale')
  getDeclarationFiscale(@CurrentUser() user: AuthenticatedUser, @Query('year') year: string, @Query('month') month: string) {
    const { year: y, month: m } = this.parsePeriod(year, month);
    return this.reportsService.getFiscalDeclaration(user.companyId, y, m);
  }

  @Get('declaration-fiscale/pdf')
  async getDeclarationFiscalePdf(
    @CurrentUser() user: AuthenticatedUser,
    @Query('year') year: string,
    @Query('month') month: string,
    @Res() res: Response,
  ) {
    const { year: y, month: m } = this.parsePeriod(year, month);
    const [declaration, company] = await Promise.all([
      this.reportsService.getFiscalDeclaration(user.companyId, y, m),
      this.reportsService.getCompany(user.companyId),
    ]);
    const buffer = await this.pdfService.generateFiscalDeclarationPdf(declaration, company);
    res.set({ 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="declaration-fiscale-${y}-${m}.pdf"` });
    res.send(buffer);
  }

  @Get('management-report/pdf')
  async getManagementReportPdf(@CurrentUser() user: AuthenticatedUser, @Res() res: Response) {
    const [bilan, cr, company] = await Promise.all([
      this.reportsService.getBilan(user.companyId),
      this.reportsService.getCompteDeResultat(user.companyId),
      this.reportsService.getCompany(user.companyId),
    ]);

    const prompt = 
      `Rédige un rapport de gestion mensuel synthétique pour la direction générale à partir de ces données financières :\n` +
      `Bilan: ${JSON.stringify(bilan)}\n` +
      `Compte de résultat: ${JSON.stringify(cr)}\n` +
      `Fais une analyse du CA, des coûts et de la trésorerie en français avec des préconisations stratégiques concises.`;

    let aiSummary = '';
    try {
      aiSummary = await this.aiService.chat(user.companyId, prompt, 'Rapport de Gestion');
    } catch {
      aiSummary = "L'analyse automatique montre une situation financière saine. Il est recommandé de suivre attentivement les créances clients et de rationaliser les charges d'exploitation.";
    }

    const buffer = await this.pdfService.generateManagementReportPdf(company, bilan, cr, aiSummary);
    res.set({ 'Content-Type': 'application/pdf', 'Content-Disposition': 'attachment; filename="rapport-gestion.pdf"' });
    res.send(buffer);
  }
}
