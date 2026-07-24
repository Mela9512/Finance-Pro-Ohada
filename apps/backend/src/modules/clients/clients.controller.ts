import { Controller, Get, Post, Body } from '@nestjs/common';
import { ClientsService } from './clients.service';

@Controller('clients')
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Get()
  getClients() {
    return this.clientsService.getClients();
  }

  @Post()
  createClient(@Body() body: any) {
    return this.clientsService.createClient(body);
  }
}
