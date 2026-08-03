import { Controller, Get, Post, Put, Body, Req } from '@nestjs/common';
import { Request } from 'express';
import { AdminService } from './admin.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { InviteUserDto } from './dto/invite-user.dto';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('company')
  getCompany(@CurrentUser() user: AuthenticatedUser) {
    return this.adminService.getCompany(user.companyId);
  }

  @Get('users')
  getUsers(@CurrentUser() user: AuthenticatedUser) {
    return this.adminService.getUsers(user.companyId);
  }

  @Put('company')
  @Roles('ADMIN')
  updateCompany(@CurrentUser() user: AuthenticatedUser, @Body() body: UpdateCompanyDto) {
    return this.adminService.updateCompany(user.companyId, user.userId, body);
  }

  @Post('onboarding')
  @Roles('ADMIN')
  completeOnboarding(@CurrentUser() user: AuthenticatedUser, @Body() body: UpdateCompanyDto) {
    return this.adminService.completeOnboarding(user.companyId, user.userId, body);
  }

  @Post('close-exercice')
  @Roles('ADMIN')
  closeExercice(@CurrentUser() user: AuthenticatedUser) {
    return this.adminService.setExerciceClosed(user.companyId, user.userId, true);
  }

  @Post('reopen-exercice')
  @Roles('ADMIN')
  reopenExercice(@CurrentUser() user: AuthenticatedUser) {
    return this.adminService.setExerciceClosed(user.companyId, user.userId, false);
  }

  @Post('users')
  @Roles('ADMIN')
  createUser(@CurrentUser() user: AuthenticatedUser, @Body() body: CreateUserDto) {
    return this.adminService.createUser(user.companyId, user.userId, body);
  }

  @Post('invite')
  @Roles('ADMIN')
  inviteUser(@CurrentUser() user: AuthenticatedUser, @Body() body: InviteUserDto, @Req() req: Request) {
    const appUrl = process.env.FRONTEND_URL || `${req.protocol}://${req.get('host')}`;
    return this.adminService.inviteUser(user.companyId, user.userId, body, appUrl);
  }
}
