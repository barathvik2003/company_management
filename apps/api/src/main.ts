import 'reflect-metadata';
import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { PrismaService } from './prisma/prisma.service';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bufferLogs: false });
  const config = app.get(ConfigService);
  const logger = new Logger('Bootstrap');

  app.setGlobalPrefix('api');
  app.use(helmet());
  app.use(cookieParser());

  app.enableCors({
    origin: config.getOrThrow<string>('WEB_ORIGIN'),
    credentials: true, // required for the auth cookies
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // strip unknown fields
      forbidNonWhitelisted: true, // reject requests that send them
      transform: true,
      transformOptions: { enableImplicitConversion: false },
    }),
  );

  app.get(PrismaService).enableShutdownHooks(app);
  app.enableShutdownHooks();

  const port = config.get<number>('PORT', 3001);
  await app.listen(port, '0.0.0.0');
  logger.log(`API listening on http://localhost:${port}/api`);
}

void bootstrap();
