import { Controller, Post, Body, Get, Param, NotFoundException, ParseIntPipe, Put, Delete, Patch } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuditService } from './audit.service';
import { CreateAuditDto } from './dto/create-audit.dto';
import { CreateDraftDto } from './dto/create-draft.dto';
import { UpdateAuditDto } from './dto/update-audit.dto';
import { Audit } from './entities/audit.entity';

@ApiTags('audits')
@Controller('audits')
export class AuditController {
    constructor(private readonly auditService: AuditService) { }

    @Post('draft')
    @ApiOperation({ summary: 'Crear un borrador de auditoría (solo datos básicos)' })
    @ApiResponse({ status: 201, description: 'Borrador creado exitosamente. Usa el ID para subir evidencias.', type: Audit })
    async createDraft(@Body() createDraftDto: CreateDraftDto): Promise<Audit> {
        return await this.auditService.createDraft(createDraftDto);
    }

    @Post()
    @ApiOperation({ summary: 'Crear una auditoría completa (con estado)' })
    @ApiResponse({ status: 201, description: 'La auditoría ha sido creada exitosamente.', type: Audit })
    async create(@Body() createAuditDto: CreateAuditDto): Promise<Audit> {
        return await this.auditService.create(createAuditDto);
    }

    @Put(':id')
    @ApiOperation({ summary: 'Actualizar una auditoría (parcial)' })
    @ApiResponse({ status: 200, description: 'Auditoría actualizada.', type: Audit })
    @ApiResponse({ status: 404, description: 'Auditoría no encontrada.' })
    async update(
        @Param('id', ParseIntPipe) id: number,
        @Body() updateAuditDto: UpdateAuditDto,
    ): Promise<Audit> {
        return await this.auditService.update(id, updateAuditDto);
    }

    @Patch(':id/complete')
    @ApiOperation({ summary: 'Completar un borrador de auditoría' })
    @ApiResponse({ status: 200, description: 'Auditoría completada.', type: Audit })
    @ApiResponse({ status: 404, description: 'Auditoría no encontrada.' })
    async complete(
        @Param('id', ParseIntPipe) id: number,
        @Body() updateAuditDto: UpdateAuditDto,
    ): Promise<Audit> {
        return await this.auditService.complete(id, updateAuditDto);
    }

    @Get()
    @ApiOperation({ summary: 'Consultar todas las auditorías' })
    @ApiResponse({ status: 200, description: 'Lista de auditorías recuperada.', type: [Audit] })
    async findAll(): Promise<Audit[]> {
        return await this.auditService.findAll();
    }

    @Get('status/drafts')
    @ApiOperation({ summary: 'Consultar solo borradores' })
    @ApiResponse({ status: 200, description: 'Lista de borradores.', type: [Audit] })
    async findDrafts(): Promise<Audit[]> {
        return await this.auditService.findDrafts();
    }

    @Get('status/completed')
    @ApiOperation({ summary: 'Consultar solo auditorías completadas' })
    @ApiResponse({ status: 200, description: 'Lista de auditorías completadas.', type: [Audit] })
    async findCompleted(): Promise<Audit[]> {
        return await this.auditService.findCompleted();
    }

    @Get(':id')
    @ApiOperation({ summary: 'Consultar una auditoría por ID' })
    @ApiResponse({ status: 200, description: 'Auditoría encontrada.', type: Audit })
    @ApiResponse({ status: 404, description: 'Auditoría no encontrada.' })
    async findOne(@Param('id', ParseIntPipe) id: number): Promise<Audit> {
        const audit = await this.auditService.findOne(id);
        if (!audit) {
            throw new NotFoundException(`Auditoría con ID ${id} no encontrada`);
        }
        return audit;
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Eliminar una auditoría' })
    @ApiResponse({ status: 200, description: 'Auditoría eliminada.' })
    @ApiResponse({ status: 404, description: 'Auditoría no encontrada.' })
    async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
        return await this.auditService.remove(id);
    }
}
