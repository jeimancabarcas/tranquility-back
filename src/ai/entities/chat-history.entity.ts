import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('chat_history')
export class ChatHistory {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    conversationId: string;

    @Column()
    role: 'user' | 'assistant' | 'system';

    @Column({ type: 'text' })
    content: string;

    @CreateDateColumn()
    createdAt: Date;
}
