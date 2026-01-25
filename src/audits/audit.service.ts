import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Audit } from './entities/audit.entity';
import { CreateAuditDto } from './dto/create-audit.dto';

@Injectable()
export class AuditService {
    constructor(
        @InjectRepository(Audit)
        private readonly auditRepository: Repository<Audit>,
    ) { }

    async create(createAuditDto: CreateAuditDto): Promise<Audit> {
        const audit = this.auditRepository.create({
            auditTitle: createAuditDto.auditTitle,
            auditTypeKey: createAuditDto.auditTypeKey,
            state: createAuditDto.state, // Direct mapping to JSONB column
        });

        return await this.auditRepository.save(audit);
    }

    async findAll(): Promise<Audit[]> {
        return await this.auditRepository.find({
            order: { createdAt: 'DESC' },
        });
    }

    async findOne(id: number): Promise<Audit | null> {
        return await this.auditRepository.findOne({
            where: { id },
        });
    }
}
