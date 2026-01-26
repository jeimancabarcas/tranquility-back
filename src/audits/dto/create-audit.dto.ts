import { Type } from 'class-transformer';
import { IsString, IsNotEmpty, IsNumber, ValidateNested, IsObject, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

class AuditStatsDto {
    @ApiProperty()
    @IsNumber()
    total: number;

    @ApiProperty()
    @IsNumber()
    completed: number;

    @ApiProperty()
    @IsNumber()
    passed: number;

    @ApiProperty()
    @IsNumber()
    partial: number;

    @ApiProperty()
    @IsNumber()
    failed: number;

    @ApiProperty()
    @IsNumber()
    criticalFailed: number;

    @ApiProperty()
    @IsNumber()
    progress: number;

    @ApiProperty()
    @IsNumber()
    totalCritical: number;

    @ApiProperty()
    @IsNumber()
    totalCheckboxes: number;

    @ApiProperty()
    @IsNumber()
    scorePercentage: number;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    concept: string;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    conceptColor: string;
}

class AuditStateDto {
    @ApiProperty({ type: AuditStatsDto })
    @IsObject()
    @ValidateNested()
    @Type(() => AuditStatsDto)
    stats: AuditStatsDto;

    @ApiProperty({ example: { 'item-1': true, 'item-2': false } })
    @IsObject()
    checklistSelection: Record<string, boolean>;

    @ApiProperty({ example: { 'item-1': false } })
    @IsObject()
    criticalFailureSelection: Record<string, boolean>;

    @ApiProperty({ example: { 'item-3': true } })
    @IsObject()
    naSelection: Record<string, boolean>;

    @ApiProperty({ example: { 'item-1': true } })
    @IsObject()
    reviewedSelection: Record<string, boolean>;

    @ApiProperty({ example: { 'item-1': 'Observación técnica' } })
    @IsObject()
    observations: Record<string, string>;

    @ApiProperty({ example: { 'res-1': true } })
    @IsObject()
    resolutionsSelection: Record<string, boolean>;
}

export class CreateAuditDto {
    @ApiProperty({ example: 'Auditoría Sede Norte - Enero 2024', required: false })
    @IsString()
    @IsOptional()
    title?: string;

    @ApiProperty({ example: 'Auditoría Mensual Cocina' })
    @IsString()
    @IsNotEmpty()
    auditTitle: string;

    @ApiProperty({ example: 'sanitary-audit-v1' })
    @IsString()
    @IsNotEmpty()
    auditTypeKey: string;

    @ApiProperty({ type: AuditStateDto })
    @IsObject()
    @ValidateNested()
    @Type(() => AuditStateDto)
    state: AuditStateDto;
}
