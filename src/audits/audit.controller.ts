import { Controller, Post, Body, Get, Param, NotFoundException, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuditService } from './audit.service';
import { CreateAuditDto } from './dto/create-audit.dto';
import { Audit } from './entities/audit.entity';

@ApiTags('audits')
@Controller('audits')
export class AuditController {
    constructor(private readonly auditService: AuditService) { }

    @Post()
    @ApiOperation({ summary: 'Crear una nueva auditoría' })
    @ApiResponse({ status: 201, description: 'La auditoría ha sido creada exitosamente.', type: Audit })
    async create(@Body() createAuditDto: CreateAuditDto): Promise<Audit> {
        return await this.auditService.create(createAuditDto);
    }

    @Get()
    @ApiOperation({ summary: 'Consultar todas las auditorías' })
    @ApiResponse({ status: 200, description: 'Lista de auditorías recuperada.', type: [Audit] })
    async findAll(): Promise<Audit[]> {
        return await this.auditService.findAll();
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
}
