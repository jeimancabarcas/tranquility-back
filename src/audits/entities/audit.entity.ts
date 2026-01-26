import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

export enum AuditStatus {
    DRAFT = 'DRAFT',
    COMPLETED = 'COMPLETED',
}

@Entity('audits')
export class Audit {
    @ApiProperty()
    @PrimaryGeneratedColumn()
    id: number;

    @ApiProperty({ required: false })
    @Column({ nullable: true })
    title: string;

    @ApiProperty()
    @Column()
    auditTitle: string;

    @ApiProperty()
    @Column()
    auditTypeKey: string;

    @ApiProperty({ enum: AuditStatus })
    @Column({
        type: 'enum',
        enum: AuditStatus,
        default: AuditStatus.DRAFT,
    })
    status: AuditStatus;

    // --- Columnas de Estadísticas Aplanadas ---
    @ApiProperty({ required: false })
    @Column({ type: 'float', nullable: true })
    scorePercentage: number;

    @ApiProperty({ required: false })
    @Column({ nullable: true })
    concept: string;

    @ApiProperty({ required: false })
    @Column({ nullable: true })
    conceptColor: string;

    @ApiProperty({ required: false })
    @Column({ type: 'float', nullable: true })
    progress: number;

    @ApiProperty({ required: false })
    @Column({ type: 'int', nullable: true })
    total: number;

    @ApiProperty({ required: false })
    @Column({ type: 'int', nullable: true })
    completed: number;

    @ApiProperty({ required: false })
    @Column({ type: 'int', nullable: true })
    passed: number;

    @ApiProperty({ required: false })
    @Column({ type: 'int', nullable: true })
    failed: number;

    @ApiProperty({ required: false })
    @Column({ type: 'int', nullable: true })
    criticalFailed: number;

    @ApiProperty({ required: false })
    @Column({ type: 'int', nullable: true })
    totalCritical: number;

    @ApiProperty({ required: false })
    @Column({ type: 'int', nullable: true })
    totalCheckboxes: number;
    // ------------------------------------------

    @ApiProperty({ required: false })
    @Column({ type: 'jsonb', nullable: true })
    state: any;

    @ApiProperty()
    @CreateDateColumn()
    createdAt: Date;

    @ApiProperty()
    @UpdateDateColumn()
    updatedAt: Date;
}
