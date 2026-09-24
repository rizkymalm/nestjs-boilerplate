import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { UnprocessableEntityException, ValidationPipe } from '@nestjs/common';
import { TransformInterceptor } from './common/utils/transform.interceptor';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const server = app.getHttpAdapter().getInstance();
  server.set('trust proxy', true);

  app.useGlobalPipes(
    new ValidationPipe({
      exceptionFactory: (errors) => {
        const details = errors.flatMap((error) =>
          Object.values(error.constraints ?? {}).map((message) => ({
            field: error.property,
            message,
          })),
        );

        return new UnprocessableEntityException({
          message: 'Unprocessable Entity - Validation failed',
          details,
          statusCode: 422,
        });
      },
    }),
  );
  app.useGlobalInterceptors(new TransformInterceptor());
  const whitelist = new Set(
    process.env.NODE_ENV === 'development'
      ? ['http://localhost:5173', 'https://staging.rizkymalm.site']
      : [
          'https://rizkymalm.com',
          'https://www.rizkymalm.com',
          'https://rizkymalm.site',
          'https://www.rizkymalm.site',
          'https://rizkymalm.space',
          'https://www.rizkymalm.space',
        ],
  );
  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => {
      if (!origin || whitelist.has(origin)) {
        return callback(null, true);
      }

      return callback(new Error('Not allowed by CORS'));
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    allowedHeaders: ['Content-Type', 'Accept', 'Authorization', 'x-api-key'],
    maxAge: 3600,
  });
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap().catch((err) => {
  console.log('Failed to start application', err);
  process.exit(1);
});
