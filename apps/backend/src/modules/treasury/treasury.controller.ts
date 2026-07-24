import { Controller, Get, Post, Body } from '@nestjs/common';
import { TreasuryService } from './treasury.service';

@Controller('treasury')
export class TreasuryController {
  constructor(private readonly treasuryService: TreasuryService) {}

  @Get('accounts')
  getAccounts() {
    return this.treasuryService.getAccounts();
  }

  @Get('transactions')
  getTransactions() {
    return this.treasuryService.getTransactions();
  }

  @Post('transactions')
  createTransaction(@Body() body: any) {
    return this.treasuryService.createTransaction(body);
  }
}
