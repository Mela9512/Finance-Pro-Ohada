import { Controller, Get, Post, Put, Body } from '@nestjs/common';
import { AdminService } from './admin.service';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('company')
  getCompany() {
    return this.adminService.getCompany();
  }

  @Put('company')
  updateCompany(@Body() body: any) {
    return this.adminService.updateCompany(body);
  }

  @Get('users')
  getUsers() {
    return this.adminService.getUsers();
  }

  @Post('users')
  createUser(@Body() body: any) {
    return this.adminService.createUser(body);
  }
}
