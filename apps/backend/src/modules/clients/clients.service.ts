import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CustomerEntity } from '../../entities/customer.entity';
import { CreateClientDto } from './dto/create-client.dto';

@Injectable()
export class ClientsService {
  constructor(@InjectRepository(CustomerEntity) private readonly repo: Repository<CustomerEntity>) {}

  getClients(companyId: string): Promise<CustomerEntity[]> {
    return this.repo.find({ where: { companyId }, order: { code: 'ASC' } });
  }

  async createClient(companyId: string, dto: CreateClientDto): Promise<CustomerEntity> {
    const count = await this.repo.count({ where: { companyId } });
    const code = `411${String(count + 1).padStart(3, '0')}`;
    const client = this.repo.create({ ...dto, code, balance: 0, companyId });
    return this.repo.save(client);
  }
}
