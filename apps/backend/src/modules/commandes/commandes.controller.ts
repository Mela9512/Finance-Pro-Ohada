import { BadRequestException, Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CommandesService } from './commandes.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { CreateCommandeDto } from './dto/create-commande.dto';

@Controller('commandes')
export class CommandesController {
  constructor(private readonly service: CommandesService) {}

  @Get()
  getCommandes(@CurrentUser() user: AuthenticatedUser) {
    return this.service.getCommandes(user.companyId);
  }

  @Get('bons-livraison')
  getBonsLivraison(@CurrentUser() user: AuthenticatedUser) {
    return this.service.getBonsLivraison(user.companyId);
  }

  @Roles('ADMIN', 'COMPTABLE', 'GESTIONNAIRE')
  @Post()
  createCommande(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateCommandeDto) {
    return this.service.createCommande(user.companyId, user.userId, dto);
  }

  @Roles('ADMIN', 'COMPTABLE', 'GESTIONNAIRE')
  @Post(':id/confirmer')
  confirmer(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.service.confirmerCommande(user.companyId, user.userId, id);
  }

  @Roles('ADMIN', 'COMPTABLE', 'GESTIONNAIRE')
  @Post(':id/annuler')
  annuler(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.service.annulerCommande(user.companyId, user.userId, id);
  }

  @Roles('ADMIN', 'COMPTABLE', 'GESTIONNAIRE')
  @Post(':id/livrer')
  livrer(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.service.livrerCommande(user.companyId, user.userId, id);
  }

  @Roles('ADMIN', 'COMPTABLE')
  @Post('bons-livraison/:id/facturer')
  facturer(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body('dueDate') dueDate: string) {
    if (!dueDate) throw new BadRequestException('Le paramètre "dueDate" est requis.');
    return this.service.facturerBonLivraison(user.companyId, user.userId, id, dueDate);
  }
}
