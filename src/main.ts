import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { INestApplication } from '@nestjs/common';

let cachedApp: INestApplication;

async function setupApp(app: INestApplication) {
  // CORS Configuration
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Swagger Configuration
  const config = new DocumentBuilder()
    .setTitle('Tranquility API')
    .setDescription('API para la gestión de autoauditorías sanitarias')
    .setVersion('1.0')
    .addTag('audits')
    .addTag('evidences')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
  }));
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await setupApp(app);
  await app.listen(process.env.PORT ?? 3000);
}

// Exportación para Vercel (Serverless Handler)
export default async (req: any, res: any) => {
  if (!cachedApp) {
    const app = await NestFactory.create(AppModule);
    await setupApp(app);
    await app.init();
    cachedApp = app;
  }

  const instance = cachedApp.getHttpAdapter().getInstance();
  instance(req, res);
};

// Solo ejecuta bootstrap si no estamos en Vercel
if (process.env.NODE_ENV !== 'production') {
  bootstrap();
}