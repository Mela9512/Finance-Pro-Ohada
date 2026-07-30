import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { AuditLogEntity } from '../../entities/audit-log.entity';
import { UserEntity } from '../../entities/user.entity';

export interface AuditLogQuery {
  page?: number;
  limit?: number;
  action?: string;
  entityType?: string;
  userId?: string;
  from?: string;
  to?: string;
}

@Injectable()
export class AuditLogService {
  constructor(
    @InjectRepository(AuditLogEntity) private readonly repo: Repository<AuditLogEntity>,
    @InjectRepository(UserEntity) private readonly userRepo: Repository<UserEntity>,
  ) {}

  async log(params: {
    companyId: string;
    userId: string;
    action: string;
    entityType?: string;
    entityId?: string;
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    await this.repo.save(this.repo.create(params));
  }

  async findByCompany(companyId: string, query: AuditLogQuery) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const qb = this.repo
      .createQueryBuilder('log')
      .where('log.companyId = :companyId', { companyId })
      .orderBy('log.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (query.action) qb.andWhere('log.action = :action', { action: query.action });
    if (query.entityType) qb.andWhere('log.entityType = :entityType', { entityType: query.entityType });
    if (query.userId) qb.andWhere('log.userId = :userId', { userId: query.userId });
    if (query.from) qb.andWhere('log.createdAt >= :from', { from: query.from });
    if (query.to) qb.andWhere('log.createdAt <= :to', { to: query.to });

    const [items, total] = await qb.getManyAndCount();

    const userIds = Array.from(new Set(items.map((i) => i.userId)));
    const users = userIds.length ? await this.userRepo.find({ where: { id: In(userIds) } }) : [];
    const userMap = new Map(users.map((u) => [u.id, u]));

    return {
      items: items.map((i) => ({
        id: i.id,
        userId: i.userId,
        userName: userMap.get(i.userId)?.name ?? 'Utilisateur supprimé',
        userEmail: userMap.get(i.userId)?.email ?? '',
        action: i.action,
        entityType: i.entityType ?? null,
        entityId: i.entityId ?? null,
        metadata: i.metadata ?? null,
        createdAt: i.createdAt,
      })),
      total,
      page,
      limit,
    };
  }

  async getDistinctActions(companyId: string): Promise<string[]> {
    const rows = await this.repo
      .createQueryBuilder('log')
      .select('DISTINCT log.action', 'action')
      .where('log.companyId = :companyId', { companyId })
      .getRawMany<{ action: string }>();
    return rows.map((r) => r.action).sort();
  }
}
