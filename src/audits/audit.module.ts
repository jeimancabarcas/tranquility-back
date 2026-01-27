import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Audit } from './entities/audit.entity';
import { AuditService } from './audit.service';
import { AuditController } from './audit.controller';
import { BlockchainModule } from '../blockchain/blockchain.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Audit]),
        BlockchainModule,
    ],
    controllers: [AuditController],
    providers: [AuditService],
    exports: [AuditService],
})
export class AuditModule { }
