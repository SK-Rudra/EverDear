import {
  type INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { parseWebOrigins } from './config/environment.js';

type ExpressSettings = {
  set(
    setting: string,
    value: number,
  ): void;
};

export function configureApp(
  app: INestApplication,
  configService: ConfigService,
): void {
  const nodeEnvironment =
    configService.getOrThrow<string>(
      'NODE_ENV',
    );

  const webOrigins = parseWebOrigins(
    configService.getOrThrow<string>(
      'WEB_ORIGIN',
    ),
  );

  const trustProxyHops =
    configService.getOrThrow<number>(
      'TRUST_PROXY_HOPS',
    );

  if (trustProxyHops > 0) {
    const expressApplication = app
      .getHttpAdapter()
      .getInstance() as ExpressSettings;

    expressApplication.set(
      'trust proxy',
      trustProxyHops,
    );
  }

  app.setGlobalPrefix('api/v1');

  app.use(
    nodeEnvironment === 'production'
      ? helmet({
          crossOriginResourcePolicy: {
            policy: 'cross-origin',
          },
        })
      : helmet({
          crossOriginResourcePolicy: {
            policy: 'cross-origin',
          },
          strictTransportSecurity: false,
        }),
  );

  app.use(cookieParser());

  app.enableCors({
    origin: webOrigins,
    credentials: true,
    methods: [
      'GET',
      'POST',
      'PUT',
      'PATCH',
      'DELETE',
      'OPTIONS',
    ],
    allowedHeaders: [
      'Accept',
      'Content-Type',
      'Range',
    ],
    exposedHeaders: [
      'Accept-Ranges',
      'Content-Length',
      'Content-Range',
    ],
    maxAge: 86_400,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
}