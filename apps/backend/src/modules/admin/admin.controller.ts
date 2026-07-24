import { Controller, Get, Post, Put, Body } from '@nestjs/common';
import { AdminService } from './admin.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { CreateUserDto } from './dto/create-user.dto';

@Controller('admin')
@Roles('ADMIN')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('company')
  getCompany(@CurrentUser() user: AuthenticatedUser) {
    return this.adminService.getCompany(user.companyId);
  }

  @Put('company')
  updateCompany(@CurrentUser() user: AuthenticatedUser, @Body() body: UpdateCompanyDto) {
    return this.adminService.updateCompany(user.companyId, user.userId, body);
  }

  @Post('close-exercice')
  closeExercice(@CurrentUser() user: AuthenticatedUser) {
    return this.adminService.setExerciceClosed(user.companyId, user.userId, true);
  }

  @Post('reopen-exercice')
  reopenExercice(@CurrentUser() user: AuthenticatedUser) {
    return this.adminService.setExerciceClosed(user.companyId, user.userId, false);
  }

  @Get('users')
  getUsers(@CurrentUser() user: AuthenticatedUser) {
    return this.adminService.getUsers(user.companyId);
  }

  @Post('users')
  createUser(@CurrentUser() user: AuthenticatedUser, @Body() body: CreateUserDto) {
    return this.adminService.createUser(user.companyId, user.userId, body);
  }
}
