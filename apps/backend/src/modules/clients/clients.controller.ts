import { Controller, Get, Post, Body } from '@nestjs/common';
import { ClientsService } from './clients.service';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { CreateClientDto } from './dto/create-client.dto';

@Controller('clients')
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Get()
  getClients(@CurrentUser() user: AuthenticatedUser) {
    return this.clientsService.getClients(user.companyId);
  }

  @Post()
  createClient(@CurrentUser() user: AuthenticatedUser, @Body() body: CreateClientDto) {
    return this.clientsService.createClient(user.companyId, body);
  }
}
