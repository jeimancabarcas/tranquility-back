import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateDraftDto {
    @ApiProperty({ example: 'Auditoría Sede Norte - Enero 2024', required: false })
    @IsString()
    @IsOptional()
    title?: string;

    @ApiProperty({ example: 'Auditoría Higiénica Standard' })
    @IsString()
    @IsNotEmpty()
    auditTitle: string;

    @ApiProperty({ example: 'sanitary-audit-v1' })
    @IsString()
    @IsNotEmpty()
    auditTypeKey: string;
}
