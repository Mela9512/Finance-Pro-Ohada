import { Controller, Get, Post, Body, Param, Put } from '@nestjs/common';
import { InvoicingService } from './invoicing.service';

@Controller('invoices')
export class InvoicingController {
  constructor(private readonly invoicingService: InvoicingService) {}

  @Get()
  getInvoices() {
    return this.invoicingService.getInvoices();
  }

  @Post()
  createInvoice(@Body() body: any) {
    return this.invoicingService.createInvoice(body);
  }

  @Put(':id/validate')
  validateInvoice(@Param('id') id: string) {
    return this.invoicingService.validateInvoice(id);
  }
}
