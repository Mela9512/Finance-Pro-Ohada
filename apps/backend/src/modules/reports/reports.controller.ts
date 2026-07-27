import { BadRequestException, Controller, Get, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import { ReportsService } from './reports.service';
import { PdfService } from '../../common/services/pdf.service';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';

@Controller('reports')
export class ReportsController {
  constructor(
    private readonly reportsService: ReportsService,
    private readonly pdfService: PdfService,
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
}
