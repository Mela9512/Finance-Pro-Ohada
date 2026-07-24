import { Controller, Get, Post, Body } from '@nestjs/common';
import { SuppliersService } from './suppliers.service';

@Controller('suppliers')
export class SuppliersController {
  constructor(private readonly suppliersService: SuppliersService) {}

  @Get()
  getSuppliers() {
    return this.suppliersService.getSuppliers();
  }

  @Post()
  createSupplier(@Body() body: any) {
    return this.suppliersService.createSupplier(body);
  }
}
