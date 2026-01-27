import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Audit, AuditStatus } from './entities/audit.entity';
import { CreateAuditDto } from './dto/create-audit.dto';
import { CreateDraftDto } from './dto/create-draft.dto';
import { UpdateAuditDto } from './dto/update-audit.dto';
import { BlockchainService } from '../blockchain/blockchain.service';

@Injectable()
export class AuditService {
    private readonly logger = new Logger(AuditService.name);

    constructor(
        @InjectRepository(Audit)
        private readonly auditRepository: Repository<Audit>,
        private readonly blockchainService: BlockchainService,
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

        // Actualizar campos
        if (updateAuditDto.title !== undefined) audit.title = updateAuditDto.title;
        if (updateAuditDto.state !== undefined) audit.state = updateAuditDto.state;

        // Aplanar estadísticas si existen
        if (updateAuditDto.state?.stats) {
            Object.assign(audit, updateAuditDto.state.stats);
        }

        // --- Flujo de Notarización Blockchain ---
        try {
            this.logger.log(`Iniciando notarización para auditoría ${id}...`);

            // 1. Preparar datos para Arweave
            // Verificamos el contenido del state antes de subir
            this.logger.debug(`Audit State Keys: ${audit.state ? Object.keys(audit.state).join(', ') : 'null'}`);
            if (audit.state && audit.state['detailedChecklist']) {
                this.logger.debug(`DetailedChecklist found with ${audit.state['detailedChecklist'].length} items`);
            } else {
                this.logger.warn('DetailedChecklist NOT found in audit.state');
            }

            // El usuario solicitó guardar SOLAMENTE el "detailedChecklist" en Arweave
            // Verificamos que state exista y tenga la propiedad
            const checklistContent = (audit.state && audit.state['detailedChecklist']) ? audit.state['detailedChecklist'] : [];

            const fullAuditData = {
                metadata: {
                    title: audit.auditTitle,
                    type: audit.auditTypeKey,
                    timestamp: new Date().toISOString(),
                    auditor_application: 'Tranquility Backend',
                },
                content: checklistContent
            };

            // 2. Subir a Arweave (Irys)
            let arweaveTxId: string | null = null;
            let arweaveCost = '0';
            try {
                this.logger.log('Subiendo a Arweave (Devnet)...');
                const uploadResult = await this.blockchainService.uploadToArweave(fullAuditData);
                arweaveTxId = uploadResult.id;
                arweaveCost = uploadResult.cost;
                audit.arweave_tx_id = arweaveTxId;
                this.logger.log(`Subida a Arweave exitosa. ID: ${arweaveTxId}`);
            } catch (arweaveError) {
                this.logger.error(`Falló subida a Arweave: ${arweaveError.message}`);
                // Decidir si fallar todo o continuar solo con hash (por ahora continuamos)
            }

            // 3. Generar Hash Consistente (incluyendo referencia a Arweave si existe)
            // IMPORTANTE: Hacemos hash de LO MISMO que subimos a Arweave para que sea verificable
            const stateToHash = {
                auditTitle: audit.auditTitle,
                auditTypeKey: audit.auditTypeKey,
                checklist: checklistContent, // Usamos el contenido filtrado
                timestamp: fullAuditData.metadata.timestamp,
                arweave_ref: arweaveTxId
            };
            const hash = this.blockchainService.generateConsistentHash(stateToHash);

            // 4. Notarizar en Solana (Hash + Referencia visible)
            // Creamos un string compuesto para que en el Explorer se vea el Link y el Hash
            const arweaveUrl = arweaveTxId ? `https://gateway.irys.xyz/${arweaveTxId}` : 'N/A';
            const memoContent = `Verifiable Audit Record\nURL:${arweaveUrl}\nHASH:${hash}`;

            const { txId, signature } = await this.blockchainService.notarizeHash(memoContent);

            // 5. Guardar metadatos de blockchain
            audit.blockchain_signature = signature;
            audit.solana_tx_id = txId;
            audit.timestamp_notarization = new Date();

            const solanaCost = '0.000005'; // Costo estimado fijo de transacción base
            const totalCost = parseFloat(arweaveCost) + parseFloat(solanaCost);

            this.logger.log(`Notarización exitosa en Solana. TX: ${txId}`);
            this.logger.log(`--- REPORTE DE COSTOS ---`);
            this.logger.log(`Arweave Storage: ${arweaveCost} SOL`);
            this.logger.log(`Solana Network Fee: ${solanaCost} SOL`);
            this.logger.log(`COSTO TOTAL: ${totalCost.toFixed(9)} SOL`);
        } catch (error) {
            this.logger.error(`Error en notarización: ${error.message}`);
            // Opcional: Podrías querer fallar si la notarización es obligatoria
            // throw new InternalServerErrorException('Error al notarizar en blockchain');
        }
        // ------------------------------------------

        audit.status = AuditStatus.COMPLETED;

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
