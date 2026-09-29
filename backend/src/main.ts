import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // Enable CORS for frontend client
  app.enableCors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  });

  // Global prefix for all API routes: /api/...
  app.setGlobalPrefix('api');

  // Enforce global request validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Configure Swagger OpenAPI documentation
  const config = new DocumentBuilder()
    .setTitle('Dhaka Tesla Pool API')
    .setDescription(
      'RESTful API documentation for Dhaka Tesla Pool carpooling platform. Features actor authentication, corridor matching, seat locking, and poysha fare calculation.',
    )
    .setVersion('1.0')
    .addTag('System', 'Health checks and system status')
    .addTag('Auth', 'Passenger and driver identity switching')
    .addTag('Ride Requests', 'Trip booking and status lifecycle')
    .addTag('Pool Engine', 'Corridor matching and atomic capacity management')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 4000;
  await app.listen(port);

  logger.log(`Backend server running on: http://localhost:${port}/api`);
  logger.log(`Swagger documentation available at: http://localhost:${port}/api/docs`);
}

bootstrap();
