import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
// Importamos el nuevo SDK sugerido por la documentación
import { GoogleGenAI } from '@google/genai';
import { ChatHistory } from './entities/chat-history.entity';

@Injectable()
export class AiService {
    private readonly logger = new Logger(AiService.name);
    private readonly client: any; // Usamos any para el nuevo SDK por ahora
    private readonly MAX_MEMORY_MESSAGES = 10;
    private readonly MASTER_PROMPT = `
Eres un Asistente Experto en Sanidad y Normatividad Colombiana (MinSalud, INVIMA), especializado en "Blindaje Legal" y "Evidencia Digital".

Tu objetivo es asesorar a auditores sanitarios para que sus actas sean técnicamente irrefutables.

DIRECTRICES:
1. Basado estrictamente en la normativa colombiana vigente (Resolución 2674 de 2013, Ley 9 de 1979, etc.).
2. Promueve el uso de evidencia fotográfica y documental.
3. Menciona siempre la importancia de la inmutabilidad de los datos (Blockchain/Arweave) cuando sea relevante para proteger legalmente el hallazgo.
4. Sé conciso, profesional y directo.
5. Si no sabes algo con certeza, indícalo, no inventes leyes.
6. Si se te proporciona una imagen, analízala con extremo detalle bajo la óptica de la normativa sanitaria colombiana.
    `.trim();

    constructor(
        private configService: ConfigService,
        @InjectRepository(ChatHistory)
        private chatHistoryRepository: Repository<ChatHistory>,
    ) {
        const apiKey = this.configService.get<string>('GEMINI_API_KEY');
        if (!apiKey) {
            this.logger.warn('GEMINI_API_KEY no configurada.');
        }

        // Inicializamos el nuevo cliente
        this.client = new GoogleGenAI({
            apiKey: apiKey || 'dummy-key'
        });
    }

    async chat(message: string, conversationId: string, contextData?: any, file?: Express.Multer.File): Promise<string> {
        try {
            // 1. Guardar mensaje
            await this.saveMessage(conversationId, 'user', message);

            // 2. Recuperar historial
            const history = await this.getHistory(conversationId);

            // 3. Preparar el contenido (Multimodal)
            let fullUserMessage = message;
            if (contextData) {
                const contextStr = typeof contextData === 'string' ? contextData : JSON.stringify(contextData);
                fullUserMessage = `CONTEXTO LEGAL EXTRA:\n${contextStr}\n\nPREGUNTA:\n${message}`;
            }

            // Construimos las partes del contenido
            const parts: any[] = [{ text: this.MASTER_PROMPT }, { text: fullUserMessage }];

            if (file) {
                parts.push({
                    inlineData: {
                        data: file.buffer.toString('base64'),
                        mimeType: file.mimetype
                    }
                });
            }

            // 4. Llamar a Gemini 3
            this.logger.log(`[PERF] Starting Gemini 3 API Call (gemini-3-flash-preview)...`);
            const startApi = Date.now();

            // Usamos la estructura del nuevo SDK
            const response = await this.client.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: [
                    // Añadimos el historial si existe
                    ...history.map(msg => ({
                        role: msg.role === 'assistant' ? 'model' : 'user',
                        parts: [{ text: msg.content }]
                    })),
                    {
                        role: 'user',
                        parts: parts
                    }
                ]
            });

            const assistantResponse = response.text || 'No pude generar una respuesta.';
            const apiTime = Date.now() - startApi;
            this.logger.log(`[PERF] Gemini 3 API Response Time: ${apiTime}ms`);

            // 5. Guardar respuesta
            await this.saveMessage(conversationId, 'assistant', assistantResponse);

            return assistantResponse;

        } catch (error) {
            this.logger.error(`Error en AiService (Gemini 3): ${error.message}`, error.stack);

            // Si el modelo está sobrecargado (503), informamos amablemente
            if (error.message.includes('503') || error.message.includes('overloaded')) {
                return "Lo siento, el modelo Gemini 3 está experimentando alta demanda en este momento. Por favor, intenta de nuevo en unos segundos.";
            }

            throw new InternalServerErrorException('Error al comunicarse con Gemini 3.');
        }
    }

    private async saveMessage(conversationId: string, role: 'user' | 'assistant' | 'system', content: string): Promise<void> {
        const entry = this.chatHistoryRepository.create({
            conversationId,
            role,
            content
        });
        await this.chatHistoryRepository.save(entry);
    }

    private async getHistory(conversationId: string): Promise<ChatHistory[]> {
        const rawHistory = await this.chatHistoryRepository.find({
            where: { conversationId },
            order: { createdAt: 'DESC' },
            take: this.MAX_MEMORY_MESSAGES
        });
        return rawHistory.reverse();
    }
}
