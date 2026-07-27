import { Controller, Get, Post, Delete, Body, Param, Res } from '@nestjs/common';
import { Response } from 'express';
import { BusinessPlanService } from './business-plan.service';
import { ReportsService } from '../reports/reports.service';
import { PdfService } from '../../common/services/pdf.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { CreateBusinessPlanDto } from './dto/create-business-plan.dto';

@Controller('business-plan')
export class BusinessPlanController {
  constructor(
    private readonly businessPlanService: BusinessPlanService,
    private readonly reportsService: ReportsService,
    private readonly pdfService: PdfService,
  ) {}

  @Get()
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.businessPlanService.getBusinessPlans(user.companyId);
  }

  @Get(':id')
  getOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.businessPlanService.getBusinessPlan(user.companyId, id);
  }

  @Roles('ADMIN', 'COMPTABLE', 'GESTIONNAIRE')
  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateBusinessPlanDto) {
    return this.businessPlanService.createBusinessPlan(user.companyId, user.userId, dto);
  }

  @Roles('ADMIN', 'COMPTABLE')
  @Delete(':id')
  remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.businessPlanService.deleteBusinessPlan(user.companyId, id);
  }

  @Get(':id/pdf')
  async getPdf(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Res() res: Response) {
    const [plan, company] = await Promise.all([
      this.businessPlanService.getBusinessPlan(user.companyId, id),
      this.reportsService.getCompany(user.companyId),
    ]);
    const buffer = await this.pdfService.generateBusinessPlanPdf(plan, company);
    res.set({ 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="business-plan-${plan.id}.pdf"` });
    res.send(buffer);
  }
}
