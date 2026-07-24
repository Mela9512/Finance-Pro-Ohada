import { Controller, Get, Post, Body, Param, Put } from '@nestjs/common';
import { InvoicingService } from './invoicing.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { CreateInvoiceDto } from './dto/create-invoice.dto';

@Controller('invoices')
export class InvoicingController {
  constructor(private readonly invoicingService: InvoicingService) {}

  @Get()
  getInvoices(@CurrentUser() user: AuthenticatedUser) {
    return this.invoicingService.getInvoices(user.companyId);
  }

  @Roles('ADMIN', 'COMPTABLE', 'GESTIONNAIRE')
  @Post()
  createInvoice(@CurrentUser() user: AuthenticatedUser, @Body() body: CreateInvoiceDto) {
    return this.invoicingService.createInvoice(user.companyId, body);
  }

  @Roles('ADMIN', 'COMPTABLE')
  @Put(':id/validate')
  validateInvoice(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.invoicingService.validateInvoice(user.companyId, user.userId, id);
  }
}
