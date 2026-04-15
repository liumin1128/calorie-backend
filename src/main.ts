import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { apiReference } from '@scalar/nestjs-api-reference';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: [`'self'`],
          styleSrc: [`'self'`, `'unsafe-inline'`, 'cdn.jsdelivr.net'],
          scriptSrc: [`'self'`, `'unsafe-inline'`, 'cdn.jsdelivr.net'],
          imgSrc: [`'self'`, 'data:', 'cdn.jsdelivr.net'],
          connectSrc: [`'self'`],
        },
      },
    }),
  );
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
  app.useGlobalFilters(new AllExceptionsFilter());

  const allowedOrigins = process.env.CORS_ORIGINS?.split(',') ?? [];
  app.enableCors({
    origin: allowedOrigins.length ? allowedOrigins : true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    credentials: true,
  });

  app.enableShutdownHooks();

  // OpenAPI + Scalar API Reference（仅 ENABLE_API_DOCS=true 时启用）
  if (process.env.ENABLE_API_DOCS === 'true') {
    const config = new DocumentBuilder()
      .setTitle('Calorie Backend API')
      .setDescription('卡路里管理应用后端 API 文档')
      .setVersion('1.0')
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, config);

    app.use('/openapi.json', (_req, res) => {
      res.json(document);
    });

    app.use(
      '/docs',
      apiReference({
        url: '/openapi.json',
        theme: 'deepSpace',
      }),
    );

    logger.log('API docs enabled at /docs');
  }

  const port = process.env.PORT ?? 3001;
  await app.listen(port);
  logger.log(`Application is running on port ${port}`);
}
void bootstrap();
