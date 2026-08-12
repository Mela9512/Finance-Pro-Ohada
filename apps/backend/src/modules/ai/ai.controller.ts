import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { AiService } from './ai.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { InvoiceOcrDto } from './dto/invoice-ocr.dto';
import { ChatDto } from './dto/chat.dto';
import { SuggestCompanyProfileDto } from './dto/suggest-company-profile.dto';

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Roles('ADMIN', 'COMPTABLE', 'GESTIONNAIRE')
  @Post('invoice-ocr')
  extractInvoice(@Body() body: InvoiceOcrDto) {
    return this.aiService.extractInvoiceFromFile(body.fileBase64, body.mimeType);
  }

  @Roles('ADMIN', 'COMPTABLE', 'GESTIONNAIRE')
  @Get('suggest-account')
  suggestAccount(@CurrentUser() user: AuthenticatedUser, @Query('wording') wording: string) {
    return this.aiService.suggestAccountCode(user.companyId, wording || '');
  }

  @Roles('ADMIN', 'COMPTABLE', 'GESTIONNAIRE')
  @Post('suggest-entry')
  suggestEntry(@CurrentUser() user: AuthenticatedUser, @Body() body: { wording: string; amount?: number }) {
    return this.aiService.suggestEntryPattern(user.companyId, body.wording || '', body.amount);
  }

  @Roles('ADMIN', 'COMPTABLE')
  @Get('anomalies')
  getAnomalies(@CurrentUser() user: AuthenticatedUser) {
    return this.aiService.detectAnomalies(user.companyId);
  }

  @Post('chat')
  async chat(@CurrentUser() user: AuthenticatedUser, @Body() body: ChatDto) {
    const answer = await this.aiService.chat(user.companyId, body.question, body.currentScreen);
    return { answer };
  }

  @Get('cashflow-forecast')
  getCashflowForecast(@CurrentUser() user: AuthenticatedUser) {
    return this.aiService.getCashflowForecast(user.companyId);
  }

  @Get('clients-risk')
  getClientsRisk(@CurrentUser() user: AuthenticatedUser) {
    return this.aiService.getClientsRiskAnalysis(user.companyId);
  }

  @Get('suppliers-overdue')
  getSuppliersOverdue(@CurrentUser() user: AuthenticatedUser) {
    return this.aiService.getSuppliersOverdueAnalysis(user.companyId);
  }

  @Get('explain-variation')
  getExplainVariation(@CurrentUser() user: AuthenticatedUser) {
    return this.aiService.explainFinancialVariation(user.companyId);
  }

  @Get('suggest-budget')
  suggestBudget(
    @CurrentUser() user: AuthenticatedUser,
    @Query('accountCode') accountCode: string,
    @Query('exercice') exercice: string,
  ) {
    return this.aiService.suggestBudgetAmount(user.companyId, accountCode, Number(exercice));
  }

  @Post('suggest-company-profile')
  suggestCompanyProfile(@Body() body: SuggestCompanyProfileDto) {
    return this.aiService.suggestCompanyProfile(
      body.companyName,
      body.sector,
      body.legalFormOptions,
      body.taxRegimeOptions,
      body.moduleOptions,
    );
  }
}
