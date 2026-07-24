import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SequenceEntity } from '../../entities/sequence.entity';

@Injectable()
export class SequenceService {
  constructor(@InjectRepository(SequenceEntity) private readonly repo: Repository<SequenceEntity>) {}

  async next(companyId: string, key: string): Promise<number> {
    return this.repo.manager.transaction(async (manager) => {
      let seq = await manager.findOne(SequenceEntity, {
        where: { companyId, key },
        lock: { mode: 'pessimistic_write' },
      });
      if (!seq) {
        seq = manager.create(SequenceEntity, { companyId, key, lastNumber: 0 });
      }
      seq.lastNumber += 1;
      await manager.save(seq);
      return seq.lastNumber;
    });
  }
}
