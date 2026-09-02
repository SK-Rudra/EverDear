import { z } from 'zod';

const OPTIONAL_URL_SCHEMA = z.preprocess(
  (value) => {
    if (
      typeof value === 'string' &&
      value.trim() === ''
    ) {
      return undefined;
    }

    return value;
  },
  z.string().trim().url().optional(),
);

const OPTIONAL_STRING_SCHEMA = z.preprocess(
  (value) => {
    if (
      typeof value === 'string' &&
      value.trim() === ''
    ) {
      return undefined;
    }

    return value;
  },
  z.string().trim().min(1).optional(),
);

const BOOLEAN_SCHEMA = z
  .preprocess((value) => {
    if (typeof value === 'boolean') {
      return value;
    }

    if (typeof value === 'string') {
      const normalized =
        value.trim().toLowerCase();

      if (normalized === 'true') {
        return true;
      }

      if (normalized === 'false') {
        return false;
      }
    }

    return value;
  }, z.boolean())
  .default(false);

const ENVIRONMENT_SCHEMA = z.object({
  NODE_ENV: z
    .enum([
      'development',
      'test',
      'production',
    ])
    .default('development'),

  PORT: z.coerce
    .number()
    .int()
    .min(1)
    .max(65_535)
    .default(4000),

  DATABASE_URL: z.string().trim().url(),

  TEST_DATABASE_URL: OPTIONAL_URL_SCHEMA,

  SHADOW_DATABASE_URL: OPTIONAL_URL_SCHEMA,

  WEB_ORIGIN: z
    .string()
    .trim()
    .min(1)
    .default('http://localhost:3000'),

  AUTH_IP_HASH_SECRET: z.string().min(
    32,
    'must contain at least 32 characters',
  ),

  PUBLIC_WALL_HASH_SECRET: z.string().min(
    32,
    'must contain at least 32 characters',
  ),

  MEDIA_STORAGE_DRIVER: z
    .enum(['local', 's3'])
    .default('local'),

  MEDIA_STORAGE_ROOT: z
    .string()
    .trim()
    .min(1)
    .default('storage/media'),

  S3_ENDPOINT: OPTIONAL_URL_SCHEMA,

  S3_REGION: z
    .string()
    .trim()
    .min(1)
    .default('auto'),

  S3_BUCKET: OPTIONAL_STRING_SCHEMA,

  S3_ACCESS_KEY_ID: OPTIONAL_STRING_SCHEMA,

  S3_SECRET_ACCESS_KEY:
    OPTIONAL_STRING_SCHEMA,

  S3_FORCE_PATH_STYLE: BOOLEAN_SCHEMA,

  TRUST_PROXY_HOPS: z.coerce
    .number()
    .int()
    .min(0)
    .max(10)
    .default(0),
});

export type EnvironmentVariables = z.infer<
  typeof ENVIRONMENT_SCHEMA
>;

export function parseWebOrigins(
  value: string,
): string[] {
  const configuredOrigins = [
    ...new Set(
      value
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean),
    ),
  ];

  if (configuredOrigins.length === 0) {
    throw new Error(
      'WEB_ORIGIN must contain at least one origin',
    );
  }

  return configuredOrigins.map((origin) => {
    let parsedOrigin: URL;

    try {
      parsedOrigin = new URL(origin);
    } catch {
      throw new Error(
        `WEB_ORIGIN contains an invalid URL: ${origin}`,
      );
    }

    if (
      parsedOrigin.protocol !== 'http:' &&
      parsedOrigin.protocol !== 'https:'
    ) {
      throw new Error(
        `WEB_ORIGIN must use HTTP or HTTPS: ${origin}`,
      );
    }

    if (
      parsedOrigin.username ||
      parsedOrigin.password ||
      parsedOrigin.pathname !== '/' ||
      parsedOrigin.search ||
      parsedOrigin.hash
    ) {
      throw new Error(
        `WEB_ORIGIN must contain origins only, without paths or credentials: ${origin}`,
      );
    }

    return parsedOrigin.origin;
  });
}

export function validateEnvironment(
  configuration: Record<string, unknown>,
): Record<string, unknown> {
  const validationResult =
    ENVIRONMENT_SCHEMA.safeParse(configuration);

  if (!validationResult.success) {
    const problems =
      validationResult.error.issues
        .map((issue) => {
          const field =
            issue.path.join('.') ||
            'environment';

          return `${field}: ${issue.message}`;
        })
        .join('; ');

    throw new Error(
      `Invalid environment configuration: ${problems}`,
    );
  }

  const validated =
    validationResult.data;

  const webOrigins = parseWebOrigins(
    validated.WEB_ORIGIN,
  );

  if (
    validated.NODE_ENV === 'production' &&
    webOrigins.some(
      (origin) =>
        new URL(origin).protocol !== 'https:',
    )
  ) {
    throw new Error(
      'WEB_ORIGIN must use HTTPS in production',
    );
  }

  if (
    validated.NODE_ENV === 'production' &&
    validated.MEDIA_STORAGE_DRIVER !== 's3'
  ) {
    throw new Error(
      'MEDIA_STORAGE_DRIVER must be s3 in production',
    );
  }

  if (
    validated.MEDIA_STORAGE_DRIVER === 's3'
  ) {
    if (!validated.S3_BUCKET) {
      throw new Error(
        'S3_BUCKET is required when MEDIA_STORAGE_DRIVER is s3',
      );
    }

    const hasAccessKey = Boolean(
      validated.S3_ACCESS_KEY_ID,
    );

    const hasSecretKey = Boolean(
      validated.S3_SECRET_ACCESS_KEY,
    );

    if (hasAccessKey !== hasSecretKey) {
      throw new Error(
        'S3_ACCESS_KEY_ID and S3_SECRET_ACCESS_KEY must be provided together',
      );
    }

    if (
      validated.S3_ENDPOINT &&
      (!hasAccessKey || !hasSecretKey)
    ) {
      throw new Error(
        'S3 credentials are required when S3_ENDPOINT is configured',
      );
    }

    if (
      !validated.S3_ENDPOINT &&
      validated.S3_REGION === 'auto'
    ) {
      throw new Error(
        'S3_REGION must be an AWS region when S3_ENDPOINT is not configured',
      );
    }

    if (
      validated.NODE_ENV === 'production' &&
      validated.S3_ENDPOINT &&
      new URL(validated.S3_ENDPOINT)
        .protocol !== 'https:'
    ) {
      throw new Error(
        'S3_ENDPOINT must use HTTPS in production',
      );
    }
  }

  return {
    ...configuration,
    ...validated,
    WEB_ORIGIN: webOrigins.join(','),
  };
}