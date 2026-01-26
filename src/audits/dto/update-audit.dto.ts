import { IsString, IsOptional, IsObject, ValidateNested, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { AuditStatus } from '../entities/audit.entity';

class AuditStatsDto {
    @ApiProperty() @IsOptional() total?: number;
    @ApiProperty() @IsOptional() completed?: number;
    @ApiProperty() @IsOptional() passed?: number;
    @ApiProperty() @IsOptional() partial?: number;
    @ApiProperty() @IsOptional() failed?: number;
    @ApiProperty() @IsOptional() criticalFailed?: number;
    @ApiProperty() @IsOptional() progress?: number;
    @ApiProperty() @IsOptional() totalCritical?: number;
    @ApiProperty() @IsOptional() totalCheckboxes?: number;
    @ApiProperty() @IsOptional() scorePercentage?: number;
    @ApiProperty() @IsOptional() concept?: string;
    @ApiProperty() @IsOptional() conceptColor?: string;
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

export class UpdateAuditDto {
    @ApiProperty({ example: 'Auditoría Mensual Cocina', required: false })
    @IsString()
    @IsOptional()
    title?: string;

    @ApiProperty({ example: 'Auditoría Higiénica Standard', required: false })
    @IsString()
    @IsOptional()
    auditTitle?: string;

    @ApiProperty({ example: 'sanitary-audit-v1', required: false })
    @IsString()
    @IsOptional()
    auditTypeKey?: string;

    @ApiProperty({ enum: AuditStatus, required: false })
    @IsEnum(AuditStatus)
    @IsOptional()
    status?: AuditStatus;

    @ApiProperty({ type: AuditStateDto, required: false })
    @IsObject()
    @ValidateNested()
    @Type(() => AuditStateDto)
    @IsOptional()
    state?: AuditStateDto;
}
