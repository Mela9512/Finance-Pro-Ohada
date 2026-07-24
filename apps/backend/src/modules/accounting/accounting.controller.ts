import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { AccountingService } from './accounting.service';

@Controller('accounting')
export class AccountingController {
  constructor(private readonly accountingService: AccountingService) {}

  @Get('accounts')
  getAccounts() {
    return this.accountingService.getAccounts();
  }

  @Get('entries')
  getEntries() {
    return this.accountingService.getJournalEntries();
  }

  @Post('entries')
  createEntry(@Body() body: any) {
    return this.accountingService.createJournalEntry(body);
  }

  @Get('grand-livre')
  getGrandLivre(@Query('accountCode') accountCode?: string) {
    return this.accountingService.getGrandLivre(accountCode);
  }

  @Get('balance')
  getBalance() {
    return this.accountingService.getBalanceGenerale();
  }
}
