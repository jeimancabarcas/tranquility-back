import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Audit } from '../../audits/entities/audit.entity';

@Entity('evidences')
export class Evidence {
    @ApiProperty()
    @PrimaryGeneratedColumn()
    id: number;

    @ApiProperty({ example: 'item-1' })
    @Column()
    checklistItemId: string;

    @ApiProperty({ example: 'image/jpeg' })
    @Column()
    mimeType: string;

    @ApiProperty({ example: 'evidencia-cocina-limpieza.jpg' })
    @Column()
    originalName: string;

    @ApiProperty({ example: 'uploads/evidences/1234567890-evidencia.jpg' })
    @Column()
    filePath: string;

    @ApiProperty({ example: 'https://storage.example.com/evidences/1234567890-evidencia.jpg' })
    @Column({ nullable: true })
    fileUrl: string;

    @ApiProperty({ example: 245678 })
    @Column({ type: 'bigint' })
    fileSize: number;

    @ApiProperty({ example: 'Evidencia de limpieza de superficies' })
    @Column({ type: 'text', nullable: true })
    description: string;

    @ApiProperty({ type: () => Audit })
    @ManyToOne(() => Audit, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'auditId' })
    audit: Audit;

    @Column()
    auditId: number;

    @ApiProperty()
    @CreateDateColumn()
    createdAt: Date;
}
