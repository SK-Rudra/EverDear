import { ConsoleLogger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { configureApp } from './app.setup.js';

const isProduction =
  process.env.NODE_ENV === 'production';

const bootstrapLogger = new ConsoleLogger({
  context: 'Bootstrap',
  json: isProduction,
  colors: !isProduction,
});

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(
    AppModule,
    {
      logger: bootstrapLogger,
    },
  );

  const configService = app.get(ConfigService);

  configureApp(app, configService);

  /*
   * Allows Prisma and other providers to close
   * safely when the deployment platform sends
   * a termination signal.
   */
  app.enableShutdownHooks();

  const port =
    configService.getOrThrow<number>('PORT');

  await app.listen(port, '0.0.0.0');

  bootstrapLogger.log(
    'EverDear API started successfully',
    {
      port,
      environment:
        configService.getOrThrow<string>(
          'NODE_ENV',
        ),
    },
  );
}

await bootstrap().catch((error: unknown) => {
  bootstrapLogger.error(
    'EverDear API failed to start',
    {
      error:
        error instanceof Error
          ? error.message
          : String(error),
      stack:
        error instanceof Error
          ? error.stack
          : undefined,
    },
  );

  process.exitCode = 1;
});