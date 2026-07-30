import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { StocksService } from './stocks.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { CreateArticleDto } from './dto/create-article.dto';
import { CreateMouvementDto } from './dto/create-mouvement.dto';

@Controller('stocks')
export class StocksController {
  constructor(private readonly service: StocksService) {}

  @Get('articles')
  findAllArticles(@CurrentUser() user: AuthenticatedUser) {
    return this.service.findAllArticles(user.companyId);
  }

  @Get('synthese')
  getSynthese(@CurrentUser() user: AuthenticatedUser) {
    return this.service.getSynthese(user.companyId);
  }

  @Get('articles/:id')
  findArticleDetail(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.service.findArticleDetail(user.companyId, id);
  }

  @Roles('ADMIN', 'COMPTABLE', 'GESTIONNAIRE')
  @Post('articles')
  createArticle(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateArticleDto) {
    return this.service.createArticle(user.companyId, user.userId, dto);
  }

  @Roles('ADMIN', 'COMPTABLE', 'GESTIONNAIRE')
  @Post('mouvements')
  createMouvement(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateMouvementDto) {
    return this.service.createMouvement(user.companyId, user.userId, dto);
  }
}
