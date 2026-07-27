import { Controller, Get, Post, Body, Param, Put, Res } from '@nestjs/common';
import { Response } from 'express';
import { InvoicingService } from './invoicing.service';
import { PdfService } from '../../common/services/pdf.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { CreateInvoiceDto } from './dto/create-invoice.dto';

@Controller('invoices')
export class InvoicingController {
  constructor(
    private readonly invoicingService: InvoicingService,
    private readonly pdfService: PdfService,
  ) {}

  @Get()
  getInvoices(@CurrentUser() user: AuthenticatedUser) {
    return this.invoicingService.getInvoices(user.companyId);
  }

  @Get(':id/pdf')
  async getInvoicePdf(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Res() res: Response) {
    const { invoice, company } = await this.invoicingService.getInvoiceForPdf(user.companyId, id);
    const buffer = await this.pdfService.generateInvoicePdf(invoice, company);
    res.set({ 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="${invoice.invoiceNumber}.pdf"` });
    res.send(buffer);
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
