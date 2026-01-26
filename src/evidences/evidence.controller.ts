import {
    Controller,
    Get,
    Post,
    Delete,
    Param,
    Body,
    UseInterceptors,
    UploadedFile,
    ParseIntPipe,
    Query,
    Res,
    BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes, ApiBody, ApiQuery } from '@nestjs/swagger';
import type { Response } from 'express';
import { EvidenceService } from './evidence.service';
import { CreateEvidenceDto } from './dto/create-evidence.dto';
import { Evidence } from './entities/evidence.entity';

@ApiTags('evidences')
@Controller('evidences')
export class EvidenceController {
    constructor(private readonly evidenceService: EvidenceService) { }

    @Post('upload')
    @ApiOperation({ summary: 'Subir evidencia para un ítem del checklist' })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                file: {
                    type: 'string',
                    format: 'binary',
                },
                checklistItemId: {
                    type: 'string',
                    example: 'item-1',
                },
                auditId: {
                    type: 'string',
                    example: 1,
                },
                description: {
                    type: 'string',
                    example: 'Evidencia de limpieza',
                },
            },
            required: ['file', 'checklistItemId', 'auditId'],
        },
    })
    @ApiResponse({ status: 201, description: 'Evidencia subida exitosamente.', type: Evidence })
    @UseInterceptors(FileInterceptor('file'))
    async uploadEvidence(
        @UploadedFile() file: Express.Multer.File,
        @Body() createEvidenceDto: CreateEvidenceDto,
    ): Promise<Evidence> {
        if (!file) {
            throw new BadRequestException('No se ha proporcionado ningún archivo');
        }

        return await this.evidenceService.create(createEvidenceDto, file);
    }

    @Get('audit/:auditId')
    @ApiOperation({ summary: 'Obtener todas las evidencias de una auditoría' })
    @ApiResponse({ status: 200, description: 'Lista de evidencias.', type: [Evidence] })
    async findByAudit(@Param('auditId', ParseIntPipe) auditId: number): Promise<Evidence[]> {
        return await this.evidenceService.findByAudit(auditId);
    }

    @Get('audit/:auditId/item/:checklistItemId')
    @ApiOperation({ summary: 'Obtener evidencias de un ítem específico del checklist' })
    @ApiResponse({ status: 200, description: 'Lista de evidencias del ítem.', type: [Evidence] })
    async findByChecklistItem(
        @Param('auditId', ParseIntPipe) auditId: number,
        @Param('checklistItemId') checklistItemId: string,
    ): Promise<Evidence[]> {
        return await this.evidenceService.findByChecklistItem(auditId, checklistItemId);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Obtener una evidencia por ID' })
    @ApiResponse({ status: 200, description: 'Evidencia encontrada.', type: Evidence })
    async findOne(@Param('id', ParseIntPipe) id: number): Promise<Evidence> {
        const evidence = await this.evidenceService.findOne(id);
        if (!evidence) {
            throw new BadRequestException('Evidencia no encontrada');
        }
        return evidence;
    }

    @Get(':id/download')
    @ApiOperation({ summary: 'Descargar archivo de evidencia' })
    @ApiResponse({ status: 200, description: 'Archivo descargado.' })
    async downloadFile(@Param('id', ParseIntPipe) id: number, @Res() res: Response): Promise<void> {
        const filePath = await this.evidenceService.getFilePath(id);
        const evidence = await this.evidenceService.findOne(id);

        if (!evidence) {
            throw new BadRequestException('Evidencia no encontrada');
        }

        res.setHeader('Content-Type', evidence.mimeType);
        res.setHeader('Content-Disposition', `attachment; filename="${evidence.originalName}"`);
        res.sendFile(filePath, { root: '.' });
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Eliminar una evidencia' })
    @ApiResponse({ status: 200, description: 'Evidencia eliminada exitosamente.' })
    async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
        return await this.evidenceService.remove(id);
    }
}
