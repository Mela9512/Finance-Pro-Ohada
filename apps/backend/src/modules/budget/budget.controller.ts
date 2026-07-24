import { Controller, Get, Post, Delete, Body, Param, Query } from '@nestjs/common';
import { BudgetService } from './budget.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { CreateBudgetDto } from './dto/create-budget.dto';

@Controller('budget')
export class BudgetController {
  constructor(private readonly budgetService: BudgetService) {}

  @Get()
  getBudgets(@CurrentUser() user: AuthenticatedUser, @Query('exercice') exercice: string) {
    return this.budgetService.getBudgets(user.companyId, Number(exercice) || new Date().getFullYear());
  }

  @Get('comparison')
  getComparison(@CurrentUser() user: AuthenticatedUser, @Query('exercice') exercice: string) {
    return this.budgetService.getComparison(user.companyId, Number(exercice) || new Date().getFullYear());
  }

  @Roles('ADMIN', 'COMPTABLE')
  @Post()
  upsertBudget(@CurrentUser() user: AuthenticatedUser, @Body() body: CreateBudgetDto) {
    return this.budgetService.upsertBudget(user.companyId, user.userId, body);
  }

  @Roles('ADMIN', 'COMPTABLE')
  @Delete(':id')
  deleteBudget(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.budgetService.deleteBudget(user.companyId, id);
  }
}
