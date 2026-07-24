import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SupplierEntity } from '../../entities/supplier.entity';
import { CreateSupplierDto } from './dto/create-supplier.dto';

@Injectable()
export class SuppliersService {
  constructor(@InjectRepository(SupplierEntity) private readonly repo: Repository<SupplierEntity>) {}

  getSuppliers(companyId: string): Promise<SupplierEntity[]> {
    return this.repo.find({ where: { companyId }, order: { code: 'ASC' } });
  }

  async createSupplier(companyId: string, dto: CreateSupplierDto): Promise<SupplierEntity> {
    const count = await this.repo.count({ where: { companyId } });
    const code = `401${String(count + 1).padStart(3, '0')}`;
    const supplier = this.repo.create({ ...dto, code, balance: 0, companyId });
    return this.repo.save(supplier);
  }
}
