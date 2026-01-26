import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Evidence } from './entities/evidence.entity';
import { CreateEvidenceDto } from './dto/create-evidence.dto';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class EvidenceService {
    private readonly uploadPath = 'uploads/evidences';

    constructor(
        @InjectRepository(Evidence)
        private readonly evidenceRepository: Repository<Evidence>,
    ) {
        // Crear directorio de uploads si no existe
        if (!fs.existsSync(this.uploadPath)) {
            fs.mkdirSync(this.uploadPath, { recursive: true });
        }
    }

    async create(
        createEvidenceDto: CreateEvidenceDto,
        file: Express.Multer.File,
    ): Promise<Evidence> {
        if (!file) {
            throw new BadRequestException('No se ha proporcionado ningún archivo');
        }

        // Validar tipo de archivo
        const allowedMimeTypes = [
            'image/jpeg',
            'image/jpg',
            'image/png',
            'image/gif',
            'image/webp',
            'application/pdf',
        ];

        if (!allowedMimeTypes.includes(file.mimetype)) {
            throw new BadRequestException(
                'Tipo de archivo no permitido. Solo se permiten imágenes (JPEG, PNG, GIF, WEBP) y PDF',
            );
        }

        // Validar tamaño (10MB máximo)
        const maxSize = 10 * 1024 * 1024; // 10MB
        if (file.size > maxSize) {
            throw new BadRequestException('El archivo excede el tamaño máximo permitido de 10MB');
        }

        const fileName = `${Date.now()}-${file.originalname}`;
        const filePath = path.join(this.uploadPath, fileName);

        // Guardar archivo
        fs.writeFileSync(filePath, file.buffer);

        const evidence = this.evidenceRepository.create({
            checklistItemId: createEvidenceDto.checklistItemId,
            auditId: Number(createEvidenceDto.auditId),
            description: createEvidenceDto.description,
            mimeType: file.mimetype,
            originalName: file.originalname,
            filePath: filePath,
            fileUrl: `/evidences/${fileName}`, // URL relativa para servir el archivo
            fileSize: file.size,
        });

        return await this.evidenceRepository.save(evidence);
    }

    async findByAudit(auditId: number): Promise<Evidence[]> {
        return await this.evidenceRepository.find({
            where: { auditId },
            order: { createdAt: 'DESC' },
        });
    }

    async findByChecklistItem(auditId: number, checklistItemId: string): Promise<Evidence[]> {
        return await this.evidenceRepository.find({
            where: { auditId, checklistItemId },
            order: { createdAt: 'DESC' },
        });
    }

    async findOne(id: number): Promise<Evidence | null> {
        return await this.evidenceRepository.findOne({
            where: { id },
        });
    }

    async remove(id: number): Promise<void> {
        const evidence = await this.findOne(id);

        if (!evidence) {
            throw new NotFoundException(`Evidencia con ID ${id} no encontrada`);
        }

        // Eliminar archivo físico
        if (fs.existsSync(evidence.filePath)) {
            fs.unlinkSync(evidence.filePath);
        }

        await this.evidenceRepository.remove(evidence);
    }

    async getFilePath(id: number): Promise<string> {
        const evidence = await this.findOne(id);

        if (!evidence) {
            throw new NotFoundException(`Evidencia con ID ${id} no encontrada`);
        }

        if (!fs.existsSync(evidence.filePath)) {
            throw new NotFoundException('El archivo de evidencia no existe en el servidor');
        }

        return evidence.filePath;
    }
}
