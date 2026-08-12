import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { AccountingService } from './accounting.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { CreateJournalEntryDto } from './dto/create-journal-entry.dto';

@Controller('accounting')
export class AccountingController {
  constructor(private readonly accountingService: AccountingService) {}

  @Get('accounts')
  getAccounts() {
    return this.accountingService.getAccounts();
  }

  @Get('entries')
  getEntries(@CurrentUser() user: AuthenticatedUser) {
    return this.accountingService.getJournalEntries(user.companyId);
  }

  @Post('entries')
  createEntry(@CurrentUser() user: AuthenticatedUser, @Body() body: CreateJournalEntryDto) {
    return this.accountingService.createJournalEntry(user.companyId, user.userId, body);
  }

  @Get('grand-livre')
  getGrandLivre(@CurrentUser() user: AuthenticatedUser, @Query('accountCode') accountCode?: string) {
    return this.accountingService.getGrandLivre(user.companyId, accountCode);
  }

  @Get('balance')
  getBalance(@CurrentUser() user: AuthenticatedUser) {
    return this.accountingService.getBalanceGenerale(user.companyId);
  }

  @Post('toggle-exercice')
  toggleExercice(@CurrentUser() user: AuthenticatedUser, @Body() body: { isClosed: boolean }) {
    return this.accountingService.toggleExerciceStatus(user.companyId, body.isClosed);
  }

  @Get('next-entry-number')
  getNextEntryNumber(
    @CurrentUser() user: AuthenticatedUser,
    @Query('journalType') journalType: string,
    @Query('date') date: string,
  ) {
    return this.accountingService.getNextEntryNumber(user.companyId, journalType, date);
  }
}
