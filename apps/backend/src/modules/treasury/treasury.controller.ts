import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { TreasuryService } from './treasury.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { CreateTreasuryTransactionDto } from './dto/create-transaction.dto';
import { ImportBankStatementDto } from './dto/import-bank-statement.dto';

@Controller('treasury')
export class TreasuryController {
  constructor(private readonly treasuryService: TreasuryService) {}

  @Get('accounts')
  getAccounts(@CurrentUser() user: AuthenticatedUser) {
    return this.treasuryService.getAccounts(user.companyId);
  }

  @Post('accounts')
  createAccount(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: { code: string; name: string; type: 'BANQUE' | 'CAISSE' | 'MOBILE_MONEY'; accountNumber?: string; rib?: string; currency?: string; balance?: number },
  ) {
    return this.treasuryService.createAccount(user.companyId, body);
  }

  @Get('transactions')
  getTransactions(@CurrentUser() user: AuthenticatedUser) {
    return this.treasuryService.getTransactions(user.companyId);
  }

  @Post('transactions')
  createTransaction(@CurrentUser() user: AuthenticatedUser, @Body() body: CreateTreasuryTransactionDto) {
    return this.treasuryService.createTransaction(user.companyId, body);
  }

  @Roles('ADMIN', 'COMPTABLE')
  @Post('accounts/:id/import-statement')
  importStatement(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() body: ImportBankStatementDto,
  ) {
    return this.treasuryService.importBankStatement(user.companyId, id, body.csvContent);
  }
}
