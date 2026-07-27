import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { AiService } from './ai.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { InvoiceOcrDto } from './dto/invoice-ocr.dto';
import { ChatDto } from './dto/chat.dto';

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

  @Roles('ADMIN', 'COMPTABLE')
  @Get('anomalies')
  getAnomalies(@CurrentUser() user: AuthenticatedUser) {
    return this.aiService.detectAnomalies(user.companyId);
  }

  @Post('chat')
  async chat(@CurrentUser() user: AuthenticatedUser, @Body() body: ChatDto) {
    const answer = await this.aiService.chat(user.companyId, body.question);
    return { answer };
  }

  @Get('cashflow-forecast')
  getCashflowForecast(@CurrentUser() user: AuthenticatedUser) {
    return this.aiService.getCashflowForecast(user.companyId);
  }
}
