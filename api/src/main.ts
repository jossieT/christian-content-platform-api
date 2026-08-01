import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  const port = configService.get<number>('PORT', 3000);
  const apiPrefix = configService.get<string>('API_PREFIX', 'api/v1');

  // Set Global API Route Prefix
  app.setGlobalPrefix(apiPrefix);

  // Enable CORS for frontend and mobile access
  app.enableCors({
    origin: true,
    credentials: true,
  });

  // Enable Global Validation Pipe with strict validation rules
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // OpenAPI / Swagger Configuration
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Christian Digital Content Platform API')
    .setDescription(
      'Production REST API providing Authentication, User Management, Digital Bookstore, and Reading Library',
    )
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT Access Token',
        in: 'header',
      },
      'JWT-auth',
    )
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(port);
  console.log(`🚀 Application listening at http://localhost:${port}/${apiPrefix}`);
  console.log(`📚 API OpenAPI Documentation: http://localhost:${port}/api/docs`);
}
bootstrap();
