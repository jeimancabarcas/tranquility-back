import { IsString, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChatRequestDto {
    @ApiProperty({ example: '¿Cuáles son los requisitos para una zona de preparación de alimentos?' })
    @IsString()
    @IsNotEmpty()
    message: string;

    @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
    @IsString()
    @IsNotEmpty()
    conversationId: string;

    @ApiProperty({ example: { auditType: 'Sanitaria', riskLevel: 'High' }, required: false })
    @IsOptional()
    contextData?: any;
}
