import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Prisma } from '../../generated/prisma/client.js';
import type {
  LetterStatus,
} from '../../generated/prisma/enums.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { CreateShareLinkDto } from './dto/create-share-link.dto.js';
import {
  ShareTokenService,
} from './share-token.service.js';
import type {
  CreatedShareLinkResponse,
  ShareLinkResponse,
} from './share.types.js';

const MINIMUM_SHARE_LIFETIME_MS =
  5 * 60 * 1000;

const MAXIMUM_SHARE_LIFETIME_MS =
  365 * 24 * 60 * 60 * 1000;

const SHARE_LINK_SELECT = {
  letterId: true,
  tokenPrefix: true,
  expiresAt: true,
  revokedAt: true,
  lastAccessedAt: true,
  accessCount: true,
  createdAt: true,
  updatedAt: true,
} as const;

type SelectedShareLink =
  Prisma.LetterLinkGetPayload<{
    select: typeof SHARE_LINK_SELECT;
  }>;

@Injectable()
export class ShareLinksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly shareTokenService:
      ShareTokenService,
  ) {}

  async createOrRegenerate(
    userId: string,
    letterId: string,
    createShareLinkDto: CreateShareLinkDto,
  ): Promise<CreatedShareLinkResponse> {
    const letter =
      await this.prisma.letter.findFirst({
        where: {
          id: letterId,
          userId,
        },
        select: {
          id: true,
          content: true,
        },
      });

    if (!letter) {
      throw new NotFoundException(
        'Letter not found',
      );
    }

    if (
      !this.hasMeaningfulContent(letter.content)
    ) {
      throw new BadRequestException(
        'Write the letter before publishing it',
      );
    }

    const now = new Date();

    const expiresAt = this.parseExpiration(
      createShareLinkDto.expiresAt,
      now,
    );

    const createdToken =
      this.shareTokenService.create();

    const shareLink =
      await this.prisma.$transaction(
        async (transaction) => {
          const updateResult =
            await transaction.letter.updateMany({
              where: {
                id: letterId,
                userId,
              },
              data: {
                status: 'PUBLISHED',
                publishedAt: now,
                expiresAt,
              },
            });

          if (updateResult.count === 0) {
            throw new NotFoundException(
              'Letter not found',
            );
          }

          return transaction.letterLink.upsert({
            where: {
              letterId,
            },
            create: {
              letterId,
              tokenHash:
                createdToken.tokenHash,
              tokenPrefix:
                createdToken.tokenPrefix,
              expiresAt,
              revokedAt: null,
              lastAccessedAt: null,
              accessCount: 0,
            },
            update: {
              tokenHash:
                createdToken.tokenHash,
              tokenPrefix:
                createdToken.tokenPrefix,
              expiresAt,
              revokedAt: null,
              lastAccessedAt: null,
              accessCount: 0,
            },
            select: SHARE_LINK_SELECT,
          });
        },
      );

    return {
      ...this.toShareLinkResponse(
        'PUBLISHED',
        shareLink,
      ),
      token: createdToken.token,
    };
  }

  async findOwnedShareLink(
    userId: string,
    letterId: string,
  ): Promise<ShareLinkResponse | null> {
    const letter =
      await this.prisma.letter.findFirst({
        where: {
          id: letterId,
          userId,
        },
        select: {
          status: true,
          shareLink: {
            select: SHARE_LINK_SELECT,
          },
        },
      });

    if (!letter) {
      throw new NotFoundException(
        'Letter not found',
      );
    }

    if (!letter.shareLink) {
      return null;
    }

    return this.toShareLinkResponse(
      letter.status,
      letter.shareLink,
    );
  }

  async revoke(
    userId: string,
    letterId: string,
  ): Promise<ShareLinkResponse> {
    const letter =
      await this.prisma.letter.findFirst({
        where: {
          id: letterId,
          userId,
        },
        select: {
          status: true,
          shareLink: {
            select: SHARE_LINK_SELECT,
          },
        },
      });

    if (!letter) {
      throw new NotFoundException(
        'Letter not found',
      );
    }

    if (!letter.shareLink) {
      throw new NotFoundException(
        'Share link not found',
      );
    }

    if (
      letter.status === 'REVOKED' &&
      letter.shareLink.revokedAt
    ) {
      return this.toShareLinkResponse(
        letter.status,
        letter.shareLink,
      );
    }

    const revokedAt = new Date();

    const updatedLink =
      await this.prisma.$transaction(
        async (transaction) => {
          await transaction.letter.update({
            where: {
              id: letterId,
            },
            data: {
              status: 'REVOKED',
            },
          });

          return transaction.letterLink.update({
            where: {
              letterId,
            },
            data: {
              revokedAt,
            },
            select: SHARE_LINK_SELECT,
          });
        },
      );

    return this.toShareLinkResponse(
      'REVOKED',
      updatedLink,
    );
  }

  private parseExpiration(
    expiresAtInput: string | null | undefined,
    now: Date,
  ): Date | null {
    if (!expiresAtInput) {
      return null;
    }

    const expiresAt = new Date(expiresAtInput);

    const minimumExpiration =
      now.getTime() +
      MINIMUM_SHARE_LIFETIME_MS;

    const maximumExpiration =
      now.getTime() +
      MAXIMUM_SHARE_LIFETIME_MS;

    if (
      expiresAt.getTime() < minimumExpiration
    ) {
      throw new BadRequestException(
        'Share links must remain valid for at least five minutes',
      );
    }

    if (
      expiresAt.getTime() > maximumExpiration
    ) {
      throw new BadRequestException(
        'Share links cannot remain valid for more than one year',
      );
    }

    return expiresAt;
  }

  private hasMeaningfulContent(
    content: Prisma.JsonValue,
  ): boolean {
    if (
      typeof content !== 'object' ||
      content === null ||
      Array.isArray(content)
    ) {
      return false;
    }

    const contentRecord = content as Record<
      string,
      unknown
    >;

    return (
      contentRecord.version === 1 &&
      typeof contentRecord.body === 'string' &&
      contentRecord.body.trim().length > 0
    );
  }

  private toShareLinkResponse(
    letterStatus: LetterStatus,
    shareLink: SelectedShareLink,
  ): ShareLinkResponse {
    return {
      letterId: shareLink.letterId,
      letterStatus,
      tokenPrefix: shareLink.tokenPrefix,
      expiresAt: shareLink.expiresAt,
      revokedAt: shareLink.revokedAt,
      lastAccessedAt:
        shareLink.lastAccessedAt,
      accessCount: shareLink.accessCount,
      createdAt: shareLink.createdAt,
      updatedAt: shareLink.updatedAt,
    };
  }
}