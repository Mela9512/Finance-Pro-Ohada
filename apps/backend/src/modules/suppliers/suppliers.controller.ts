import { Controller, Get, Post, Body } from '@nestjs/common';
import { SuppliersService } from './suppliers.service';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { CreateSupplierDto } from './dto/create-supplier.dto';

@Controller('suppliers')
export class SuppliersController {
  constructor(private readonly suppliersService: SuppliersService) {}

  @Get()
  getSuppliers(@CurrentUser() user: AuthenticatedUser) {
    return this.suppliersService.getSuppliers(user.companyId);
  }

  @Post()
  createSupplier(@CurrentUser() user: AuthenticatedUser, @Body() body: CreateSupplierDto) {
    return this.suppliersService.createSupplier(user.companyId, body);
  }
}
