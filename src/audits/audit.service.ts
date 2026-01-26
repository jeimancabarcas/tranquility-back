import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Audit, AuditStatus } from './entities/audit.entity';
import { CreateAuditDto } from './dto/create-audit.dto';
import { CreateDraftDto } from './dto/create-draft.dto';
import { UpdateAuditDto } from './dto/update-audit.dto';

@Injectable()
export class AuditService {
    constructor(
        @InjectRepository(Audit)
        private readonly auditRepository: Repository<Audit>,
    ) { }

    async createDraft(createDraftDto: CreateDraftDto): Promise<Audit> {
        const audit = this.auditRepository.create({
            title: createDraftDto.title,
            auditTitle: createDraftDto.auditTitle,
            auditTypeKey: createDraftDto.auditTypeKey,
            status: AuditStatus.DRAFT,
            state: null,
        });

        return await this.auditRepository.save(audit);
    }

    async create(createAuditDto: CreateAuditDto): Promise<Audit> {
        const audit = this.auditRepository.create({
            title: createAuditDto.title,
            auditTitle: createAuditDto.auditTitle,
            auditTypeKey: createAuditDto.auditTypeKey,
            state: createAuditDto.state,
            status: AuditStatus.COMPLETED,
        });

        // Aplanar estadísticas si existen
        if (createAuditDto.state?.stats) {
            Object.assign(audit, createAuditDto.state.stats);
        }

        return await this.auditRepository.save(audit);
    }

    async update(id: number, updateAuditDto: UpdateAuditDto): Promise<Audit> {
        const audit = await this.findOne(id);

        if (!audit) {
            throw new NotFoundException(`Auditoría con ID ${id} no encontrada`);
        }

        // Actualizar solo los campos proporcionados
        if (updateAuditDto.title !== undefined) audit.title = updateAuditDto.title;
        if (updateAuditDto.auditTitle !== undefined) audit.auditTitle = updateAuditDto.auditTitle;
        if (updateAuditDto.auditTypeKey !== undefined) audit.auditTypeKey = updateAuditDto.auditTypeKey;
        if (updateAuditDto.state !== undefined) audit.state = updateAuditDto.state;
        if (updateAuditDto.status !== undefined) audit.status = updateAuditDto.status;

        // Si se actualiza el state, actualizamos las columnas aplanadas
        if (updateAuditDto.state?.stats) {
            Object.assign(audit, updateAuditDto.state.stats);
        }

        return await this.auditRepository.save(audit);
    }

    async complete(id: number, updateAuditDto: UpdateAuditDto): Promise<Audit> {
        const audit = await this.findOne(id);

        if (!audit) {
            throw new NotFoundException(`Auditoría con ID ${id} no encontrada`);
        }

        // Actualizar campos y marcar como completada
        if (updateAuditDto.title !== undefined) audit.title = updateAuditDto.title;
        if (updateAuditDto.state !== undefined) audit.state = updateAuditDto.state;

        audit.status = AuditStatus.COMPLETED;

        // Aplanar estadísticas si existen
        if (updateAuditDto.state?.stats) {
            Object.assign(audit, updateAuditDto.state.stats);
        }

        return await this.auditRepository.save(audit);
    }

    async findAll(): Promise<Audit[]> {
        return await this.auditRepository.find({
            order: { createdAt: 'DESC' },
        });
    }

    async findDrafts(): Promise<Audit[]> {
        return await this.auditRepository.find({
            where: { status: AuditStatus.DRAFT },
            order: { createdAt: 'DESC' },
        });
    }

    async findCompleted(): Promise<Audit[]> {
        return await this.auditRepository.find({
            where: { status: AuditStatus.COMPLETED },
            order: { createdAt: 'DESC' },
        });
    }

    async findOne(id: number): Promise<Audit | null> {
        return await this.auditRepository.findOne({
            where: { id },
        });
    }

    async remove(id: number): Promise<void> {
        const audit = await this.findOne(id);

        if (!audit) {
            throw new NotFoundException(`Auditoría con ID ${id} no encontrada`);
        }

        await this.auditRepository.remove(audit);
    }
}
