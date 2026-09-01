import {
  type INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export function configureApp(
  app: INestApplication,
  configService: ConfigService,
) {
  const webOrigin = configService.get<string>(
    'WEB_ORIGIN',
    'http://localhost:3000',
  );

  app.setGlobalPrefix('api/v1');

  app.enableCors({
    origin: webOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
}