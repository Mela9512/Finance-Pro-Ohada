import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { PaieService } from './paie.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { CreateBulletinDto } from './dto/create-bulletin.dto';

@Controller('paie')
export class PaieController {
  constructor(private readonly service: PaieService) {}

  @Get('employees')
  getEmployees(@CurrentUser() user: AuthenticatedUser) {
    return this.service.getEmployees(user.companyId);
  }

  @Roles('ADMIN', 'COMPTABLE')
  @Post('employees')
  createEmployee(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateEmployeeDto) {
    return this.service.createEmployee(user.companyId, user.userId, dto);
  }

  @Get('bulletins')
  getBulletins(@CurrentUser() user: AuthenticatedUser) {
    return this.service.getBulletins(user.companyId);
  }

  @Roles('ADMIN', 'COMPTABLE')
  @Post('bulletins')
  createBulletin(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateBulletinDto) {
    return this.service.createBulletin(user.companyId, user.userId, dto);
  }

  @Roles('ADMIN', 'COMPTABLE')
  @Post('bulletins/:id/valider')
  validateBulletin(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.service.validateBulletin(user.companyId, user.userId, id);
  }
}
