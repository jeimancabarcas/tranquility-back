import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
    Connection,
    Keypair,
    Transaction,
    TransactionInstruction,
    PublicKey,
    sendAndConfirmTransaction
} from '@solana/web3.js';
import bs58 from 'bs58';
import * as crypto from 'crypto';

@Injectable()
export class BlockchainService {
    private readonly logger = new Logger(BlockchainService.name);
    private readonly connection: Connection;
    private readonly wallet: Keypair;
    private readonly MEMO_PROGRAM_ID = new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr');

    constructor(private configService: ConfigService) {
        const rpcUrl = this.configService.get<string>('SOLANA_RPC_URL') || 'https://api.devnet.solana.com';
        this.connection = new Connection(rpcUrl, 'confirmed');

        const secretKeyString = this.configService.get<string>('SOLANA_SECRET_KEY');
        if (secretKeyString) {
            try {
                this.wallet = Keypair.fromSecretKey(bs58.decode(secretKeyString));
                this.logger.log(`Blockchain Wallet cargada: ${this.wallet.publicKey.toBase58()}`);
            } catch (error) {
                this.logger.error('Error al cargar la wallet de Solana. Verifique SOLANA_SECRET_KEY.');
            }
        } else {
            this.logger.warn('SOLANA_SECRET_KEY no configurada. La notarización fallará.');
        }
    }

    /**
     * Genera un hash SHA-256 consistente de un objeto JSON.
     */
    generateConsistentHash(data: any): string {
        // Ordenar claves para asegurar consistencia
        const sortedData = this.sortObjectKeys(data);
        const jsonString = JSON.stringify(sortedData);
        return crypto.createHash('sha256').update(jsonString).digest('hex');
    }

    /**
     * Notariza un hash en la blockchain de Solana usando el Memo Program.
     */
    /**
     * Notariza un hash en la blockchain de Solana usando el Memo Program.
     */
    async notarizeHash(hash: string): Promise<{ txId: string; signature: string }> {
        if (!this.wallet) {
            throw new Error('Wallet no configurada para notarización');
        }

        const instruction = new TransactionInstruction({
            keys: [{ pubkey: this.wallet.publicKey, isSigner: true, isWritable: false }],
            programId: this.MEMO_PROGRAM_ID,
            data: Buffer.from(hash, 'utf-8'),
        });

        const transaction = new Transaction().add(instruction);

        try {
            const signature = await sendAndConfirmTransaction(
                this.connection,
                transaction,
                [this.wallet]
            );

            return {
                txId: signature,
                signature: signature, // En este caso el TX ID es la firma
            };
        } catch (error) {
            this.logger.error(`Error en la transacción de Solana: ${error.message}`);
            throw error;
        }
    }

    /**
     * Sube datos JSON a Arweave usando Irys (antes Bundlr).
     */
    async uploadToArweave(data: any): Promise<{ id: string; cost: string }> {
        if (!this.wallet) {
            throw new Error('Wallet no configurada para subir a Arweave');
        }

        try {
            // Importación dinámica para evitar problemas con CommonJS/ESM si es necesario
            const { default: Irys } = await import('@irys/sdk');

            const irys = new Irys({
                url: 'https://devnet.irys.xyz', // Nodo Devnet de Irys
                token: 'solana',
                key: this.wallet.secretKey,
                config: { providerUrl: this.configService.get<string>('SOLANA_RPC_URL') || 'https://api.devnet.solana.com' },
            });

            const dataToUpload = JSON.stringify(data);
            const size = Buffer.byteLength(dataToUpload, 'utf-8');
            const priceAtomic = await irys.getPrice(size);
            const priceSol = irys.utils.fromAtomic(priceAtomic);

            // Financiar si es necesario (en devnet suele ser gratuito o muy barato, pero verificamos)
            // Para devnet Irys, SOL es "gratis" si usas el faucet de ellos o simplemente funciona con el nodo devnet.
            // Para simplificar en devnet, intentamos subir directamente. 
            // Si falla por saldo, el usuario deberá fondear en Irys Devnet, pero generalmente usa el saldo SOL de la wallet.

            const receipt = await irys.upload(dataToUpload, {
                tags: [{ name: 'Content-Type', value: 'application/json' }, { name: 'App-Name', value: 'Tranquility-Audit' }]
            });

            this.logger.log(`Datos subidos a Arweave: https://gateway.irys.xyz/${receipt.id} (Costo: ${priceSol} SOL)`);
            return { id: receipt.id, cost: priceSol.toString() };

        } catch (error) {
            this.logger.error(`Error subiendo a Arweave: ${error.message}`);
            throw error;
        }
    }

    private sortObjectKeys(obj: any): any {
        if (obj === null || typeof obj !== 'object' || Array.isArray(obj)) {
            return obj;
        }

        return Object.keys(obj)
            .sort()
            .reduce((result, key) => {
                result[key] = this.sortObjectKeys(obj[key]);
                return result;
            }, {});
    }
}
