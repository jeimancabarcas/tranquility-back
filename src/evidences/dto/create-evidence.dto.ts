import { IsString, IsNotEmpty, IsOptional, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateEvidenceDto {
    @ApiProperty({ example: 'item-1', description: 'ID del ítem del checklist' })
    @IsString()
    @IsNotEmpty()
    checklistItemId: string;

    @ApiProperty({ example: 1, description: 'ID de la auditoría' })
    @IsString()
    auditId: string;

    @ApiProperty({ example: 'Evidencia de limpieza', required: false })
    @IsString()
    @IsOptional()
    description?: string;
}
