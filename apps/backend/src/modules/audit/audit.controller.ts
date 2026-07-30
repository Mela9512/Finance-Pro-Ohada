import { Controller, Get, Query } from '@nestjs/common';
import { AuditLogService } from '../../common/services/audit-log.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { AuditLogQueryDto } from './dto/audit-log-query.dto';

@Controller('audit')
export class AuditController {
  constructor(private readonly auditLogService: AuditLogService) {}

  @Roles('ADMIN', 'COMPTABLE')
  @Get()
  findAll(@CurrentUser() user: AuthenticatedUser, @Query() query: AuditLogQueryDto) {
    return this.auditLogService.findByCompany(user.companyId, query);
  }

  @Roles('ADMIN', 'COMPTABLE')
  @Get('actions')
  getDistinctActions(@CurrentUser() user: AuthenticatedUser) {
    return this.auditLogService.getDistinctActions(user.companyId);
  }
}
