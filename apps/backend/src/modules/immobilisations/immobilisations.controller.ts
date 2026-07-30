import { BadRequestException, Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ImmobilisationsService } from './immobilisations.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { CreateImmobilisationDto } from './dto/create-immobilisation.dto';
import { CessionImmobilisationDto } from './dto/cession-immobilisation.dto';

@Controller('immobilisations')
export class ImmobilisationsController {
  constructor(private readonly service: ImmobilisationsService) {}

  @Get()
  findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.service.findAll(user.companyId);
  }

  @Get('synthese')
  getSynthese(@CurrentUser() user: AuthenticatedUser, @Query('year') year: string) {
    const y = Number(year) || new Date().getFullYear();
    return this.service.getSyntheseParExercice(user.companyId, y);
  }

  @Get(':id')
  findOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.service.findOne(user.companyId, id);
  }

  @Roles('ADMIN', 'COMPTABLE')
  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateImmobilisationDto) {
    return this.service.create(user.companyId, user.userId, dto);
  }

  @Roles('ADMIN', 'COMPTABLE')
  @Post(':id/cession')
  cession(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() dto: CessionImmobilisationDto) {
    return this.service.cession(user.companyId, user.userId, id, dto);
  }

  @Roles('ADMIN', 'COMPTABLE')
  @Post('generer-dotation')
  genererDotation(@CurrentUser() user: AuthenticatedUser, @Body('year') year: number) {
    if (!year) throw new BadRequestException('Le paramètre "year" est requis.');
    return this.service.genererEcritureDotation(user.companyId, user.userId, year);
  }
}
