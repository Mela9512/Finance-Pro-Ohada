import { Controller, Get } from '@nestjs/common';
import { ReportsService } from './reports.service';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('bilan')
  getBilan() {
    return this.reportsService.getBilan();
  }

  @Get('compte-resultat')
  getCompteDeResultat() {
    return this.reportsService.getCompteDeResultat();
  }

  @Get('tft')
  getTFT() {
    return this.reportsService.getTFT();
  }
}
