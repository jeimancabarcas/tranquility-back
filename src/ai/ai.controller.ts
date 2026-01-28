import { Controller, Post, Body, HttpCode, HttpStatus, UsePipes, ValidationPipe, UseInterceptors, UploadedFile } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { AiService } from './ai.service';
import { ChatRequestDto } from './dto/chat-request.dto';

@ApiTags('AI Assistant')
@Controller('ai')
export class AiController {
    constructor(private readonly aiService: AiService) { }

    @Post('chat')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Chat with the Sanitary Expert AI (Supports Vision)' })
    @ApiResponse({ status: 200, description: 'Successful response from AI.' })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                message: { type: 'string' },
                conversationId: { type: 'string' },
                contextData: { type: 'string' }, // En multipart, los objetos vienen como string
                image: {
                    type: 'string',
                    format: 'binary',
                },
            },
        },
    })
    @UseInterceptors(FileInterceptor('image'))
    @UsePipes(new ValidationPipe({ whitelist: true }))
    async chat(
        @Body() chatRequest: ChatRequestDto,
        @UploadedFile() file?: Express.Multer.File
    ) {
        const response = await this.aiService.chat(
            chatRequest.message,
            chatRequest.conversationId,
            chatRequest.contextData,
            file
        );
        return { response };
    }
}
