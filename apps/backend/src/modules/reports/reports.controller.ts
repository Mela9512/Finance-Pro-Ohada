import { Controller, Get } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('bilan')
  getBilan(@CurrentUser() user: AuthenticatedUser) {
    return this.reportsService.getBilan(user.companyId);
  }

  @Get('compte-resultat')
  getCompteDeResultat(@CurrentUser() user: AuthenticatedUser) {
    return this.reportsService.getCompteDeResultat(user.companyId);
  }

  @Get('tft')
  getTFT(@CurrentUser() user: AuthenticatedUser) {
    return this.reportsService.getTFT(user.companyId);
  }
}
