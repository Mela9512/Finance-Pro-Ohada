import { Controller, Get, Post, Body } from '@nestjs/common';
import { TreasuryService } from './treasury.service';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { CreateTreasuryTransactionDto } from './dto/create-transaction.dto';

@Controller('treasury')
export class TreasuryController {
  constructor(private readonly treasuryService: TreasuryService) {}

  @Get('accounts')
  getAccounts(@CurrentUser() user: AuthenticatedUser) {
    return this.treasuryService.getAccounts(user.companyId);
  }

  @Get('transactions')
  getTransactions(@CurrentUser() user: AuthenticatedUser) {
    return this.treasuryService.getTransactions(user.companyId);
  }

  @Post('transactions')
  createTransaction(@CurrentUser() user: AuthenticatedUser, @Body() body: CreateTreasuryTransactionDto) {
    return this.treasuryService.createTransaction(user.companyId, body);
  }
}
