import { createHmac } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  MAX_ACTIVE_SESSIONS,
  SESSION_DURATION_MS,
  SESSION_TOUCH_INTERVAL_MS,
} from './auth.constants.js';
import type {
  CreatedAuthSession,
  ResolvedAuthSession,
  SessionMetadata,
} from './auth.types.js';
import { SessionTokenService } from './session-token.service.js';

@Injectable()
export class SessionService {
  private readonly ipHashSecret: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly tokenService: SessionTokenService,
    configService: ConfigService,
  ) {
    const ipHashSecret =
      configService.getOrThrow<string>(
        'AUTH_IP_HASH_SECRET',
      );

    if (Buffer.byteLength(ipHashSecret, 'utf8') < 32) {
      throw new Error(
        'AUTH_IP_HASH_SECRET must contain at least 32 characters',
      );
    }

    this.ipHashSecret = ipHashSecret;
  }

  createSession(
    userId: string,
    metadata: SessionMetadata,
  ): Promise<CreatedAuthSession> {
    return this.createSessionWithClient(
      this.prisma,
      userId,
      metadata,
    );
  }

  createSessionInTransaction(
    transaction: Prisma.TransactionClient,
    userId: string,
    metadata: SessionMetadata,
  ): Promise<CreatedAuthSession> {
    return this.createSessionWithClient(
      transaction,
      userId,
      metadata,
    );
  }

  async resolveSession(
    token: unknown,
  ): Promise<ResolvedAuthSession | null> {
    if (!this.tokenService.isValidSessionToken(token)) {
      return null;
    }

    const tokenHash =
      this.tokenService.hashSessionToken(token);

    const session =
      await this.prisma.session.findUnique({
        where: {
          tokenHash,
        },
        select: {
          id: true,
          expiresAt: true,
          lastUsedAt: true,
          revokedAt: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              isActive: true,
              emailVerifiedAt: true,
              createdAt: true,
            },
          },
        },
      });

    if (!session) {
      return null;
    }

    const now = new Date();

    if (
      session.revokedAt ||
      session.expiresAt.getTime() <= now.getTime() ||
      !session.user.isActive
    ) {
      return null;
    }

    const shouldTouch =
      !session.lastUsedAt ||
      now.getTime() -
        session.lastUsedAt.getTime() >=
        SESSION_TOUCH_INTERVAL_MS;

    if (shouldTouch) {
      await this.prisma.session.updateMany({
        where: {
          id: session.id,
          revokedAt: null,
          expiresAt: {
            gt: now,
          },
        },
        data: {
          lastUsedAt: now,
        },
      });
    }

    return {
      id: session.id,
      expiresAt: session.expiresAt,
      user: {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        role: session.user.role,
        emailVerifiedAt:
          session.user.emailVerifiedAt,
        createdAt: session.user.createdAt,
      },
    };
  }

  async revokeSession(token: unknown): Promise<boolean> {
    if (!this.tokenService.isValidSessionToken(token)) {
      return false;
    }

    const result =
      await this.prisma.session.updateMany({
        where: {
          tokenHash:
            this.tokenService.hashSessionToken(token),
          revokedAt: null,
        },
        data: {
          revokedAt: new Date(),
        },
      });

    return result.count > 0;
  }

  async revokeAllUserSessions(
    userId: string,
  ): Promise<number> {
    const result =
      await this.prisma.session.updateMany({
        where: {
          userId,
          revokedAt: null,
        },
        data: {
          revokedAt: new Date(),
        },
      });

    return result.count;
  }

  private async createSessionWithClient(
    database: Prisma.TransactionClient,
    userId: string,
    metadata: SessionMetadata,
  ): Promise<CreatedAuthSession> {
    const now = new Date();
    const expiresAt = new Date(
      now.getTime() + SESSION_DURATION_MS,
    );

    await database.session.deleteMany({
      where: {
        userId,
        OR: [
          {
            expiresAt: {
              lte: now,
            },
          },
          {
            revokedAt: {
              not: null,
            },
          },
        ],
      },
    });

    const activeSessions =
      await database.session.findMany({
        where: {
          userId,
          revokedAt: null,
          expiresAt: {
            gt: now,
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        select: {
          id: true,
        },
      });

    const sessionsToRemove = activeSessions.slice(
      MAX_ACTIVE_SESSIONS - 1,
    );

    if (sessionsToRemove.length > 0) {
      await database.session.deleteMany({
        where: {
          id: {
            in: sessionsToRemove.map(
              (session) => session.id,
            ),
          },
        },
      });
    }

    const createdToken =
      this.tokenService.createSessionToken();

    await database.session.create({
      data: {
        userId,
        tokenHash: createdToken.tokenHash,
        userAgent: this.normalizeUserAgent(
          metadata.userAgent,
        ),
        ipHash: this.hashIpAddress(
          metadata.ipAddress,
        ),
        expiresAt,
        lastUsedAt: now,
      },
    });

    return {
      token: createdToken.token,
      expiresAt,
    };
  }

  private normalizeUserAgent(
    userAgent: string | undefined,
  ): string | null {
    const normalized = userAgent?.trim();

    return normalized
      ? normalized.slice(0, 512)
      : null;
  }

  private hashIpAddress(
    ipAddress: string | undefined,
  ): string | null {
    const normalized = ipAddress?.trim();

    if (!normalized) {
      return null;
    }

    return createHmac(
      'sha256',
      this.ipHashSecret,
    )
      .update(normalized, 'utf8')
      .digest('hex');
  }
}