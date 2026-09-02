import {
  describe,
  expect,
  it,
} from 'vitest';
import { validateEnvironment } from './environment.js';

function createValidEnvironment(): Record<
  string,
  unknown
> {
  return {
    NODE_ENV: 'test',
    PORT: '4000',
    DATABASE_URL:
      'postgresql://everdear_app:test_password@localhost:5432/everdear_test?schema=public',
    WEB_ORIGIN: 'http://localhost:3000',
    AUTH_IP_HASH_SECRET:
      'authentication-test-secret-with-32-characters',
    PUBLIC_WALL_HASH_SECRET:
      'public-wall-test-secret-with-32-characters',
    MEDIA_STORAGE_DRIVER: 'local',
    MEDIA_STORAGE_ROOT: 'storage/media',
    TRUST_PROXY_HOPS: '0',
  };
}

function createProductionS3Environment(): Record<
  string,
  unknown
> {
  return {
    ...createValidEnvironment(),
    NODE_ENV: 'production',
    WEB_ORIGIN:
      'https://everdear.example.com',
    MEDIA_STORAGE_DRIVER: 's3',
    S3_ENDPOINT:
      'https://example-account.r2.cloudflarestorage.com',
    S3_REGION: 'auto',
    S3_BUCKET: 'everdear-media',
    S3_ACCESS_KEY_ID: 'test-access-key',
    S3_SECRET_ACCESS_KEY:
      'test-secret-access-key',
    S3_FORCE_PATH_STYLE: 'false',
  };
}

describe('validateEnvironment', () => {
  it('accepts and converts valid configuration', () => {
    const environment = validateEnvironment({
      ...createValidEnvironment(),
      PORT: '4500',
      TRUST_PROXY_HOPS: '2',
      S3_FORCE_PATH_STYLE: 'true',
      WEB_ORIGIN:
        'https://everdear.example.com,https://admin.everdear.example.com',
    });

    expect(environment.PORT).toBe(4500);
    expect(environment.TRUST_PROXY_HOPS).toBe(
      2,
    );
    expect(
      environment.S3_FORCE_PATH_STYLE,
    ).toBe(true);
    expect(environment.WEB_ORIGIN).toBe(
      'https://everdear.example.com,https://admin.everdear.example.com',
    );
  });

  it('applies safe development defaults', () => {
    const validEnvironment =
      createValidEnvironment();

    const environment = validateEnvironment({
      DATABASE_URL:
        validEnvironment.DATABASE_URL,
      AUTH_IP_HASH_SECRET:
        validEnvironment.AUTH_IP_HASH_SECRET,
      PUBLIC_WALL_HASH_SECRET:
        validEnvironment.PUBLIC_WALL_HASH_SECRET,
    });

    expect(environment.NODE_ENV).toBe(
      'development',
    );
    expect(environment.PORT).toBe(4000);
    expect(environment.WEB_ORIGIN).toBe(
      'http://localhost:3000',
    );
    expect(
      environment.MEDIA_STORAGE_DRIVER,
    ).toBe('local');
    expect(environment.MEDIA_STORAGE_ROOT).toBe(
      'storage/media',
    );
    expect(environment.S3_REGION).toBe('auto');
    expect(
      environment.S3_FORCE_PATH_STYLE,
    ).toBe(false);
    expect(environment.TRUST_PROXY_HOPS).toBe(0);
  });

  it('rejects short authentication secrets', () => {
    expect(() =>
      validateEnvironment({
        ...createValidEnvironment(),
        AUTH_IP_HASH_SECRET: 'too-short',
      }),
    ).toThrow();
  });

  it('rejects an invalid port', () => {
    expect(() =>
      validateEnvironment({
        ...createValidEnvironment(),
        PORT: '70000',
      }),
    ).toThrow();
  });

  it('rejects an invalid web origin', () => {
    expect(() =>
      validateEnvironment({
        ...createValidEnvironment(),
        WEB_ORIGIN: 'not-a-valid-origin',
      }),
    ).toThrow();
  });

  it('requires HTTPS origins in production', () => {
    expect(() =>
      validateEnvironment({
        ...createProductionS3Environment(),
        WEB_ORIGIN:
          'http://everdear.example.com',
      }),
    ).toThrow();
  });

  it('accepts HTTPS origins in production', () => {
    const environment = validateEnvironment(
      createProductionS3Environment(),
    );

    expect(environment.NODE_ENV).toBe(
      'production',
    );
    expect(environment.WEB_ORIGIN).toBe(
      'https://everdear.example.com',
    );
  });

  it('requires S3 storage in production', () => {
    expect(() =>
      validateEnvironment({
        ...createProductionS3Environment(),
        MEDIA_STORAGE_DRIVER: 'local',
      }),
    ).toThrow(
      /MEDIA_STORAGE_DRIVER must be s3/,
    );
  });

  it('requires an S3 bucket', () => {
    expect(() =>
      validateEnvironment({
        ...createProductionS3Environment(),
        S3_BUCKET: undefined,
      }),
    ).toThrow(/S3_BUCKET is required/);
  });

  it('requires S3 credentials as a pair', () => {
    expect(() =>
      validateEnvironment({
        ...createProductionS3Environment(),
        S3_SECRET_ACCESS_KEY: undefined,
      }),
    ).toThrow(
      /must be provided together/,
    );
  });

  it('rejects an insecure production S3 endpoint', () => {
    expect(() =>
      validateEnvironment({
        ...createProductionS3Environment(),
        S3_ENDPOINT:
          'http://storage.example.com',
      }),
    ).toThrow(
      /S3_ENDPOINT must use HTTPS/,
    );
  });
});