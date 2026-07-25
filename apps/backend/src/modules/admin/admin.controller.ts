import { Controller, Get, Post, Put, Body, Req } from '@nestjs/common';
import { Request } from 'express';
import { AdminService } from './admin.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { InviteUserDto } from './dto/invite-user.dto';

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

  @Post('onboarding')
  completeOnboarding(@CurrentUser() user: AuthenticatedUser, @Body() body: UpdateCompanyDto) {
    return this.adminService.completeOnboarding(user.companyId, user.userId, body);
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

  @Post('invite')
  inviteUser(@CurrentUser() user: AuthenticatedUser, @Body() body: InviteUserDto, @Req() req: Request) {
    const appUrl = process.env.FRONTEND_URL || `${req.protocol}://${req.get('host')}`;
    return this.adminService.inviteUser(user.companyId, user.userId, body, appUrl);
  }
}
