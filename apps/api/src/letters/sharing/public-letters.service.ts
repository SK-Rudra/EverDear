import {
  GoneException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import type { Prisma } from '../../generated/prisma/client.js';
import { MediaStorage } from '../../media/storage/media-storage.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { LetterContentV1 } from '../letter.types.js';
import { ShareTokenService } from './share-token.service.js';
import type {
  OpenedPublicAttachment,
  PublicAttachmentResponse,
  PublicLetterResponse,
} from './share.types.js';

const PUBLIC_ATTACHMENT_SELECT = {
  id: true,
  type: true,
  status: true,
  storageKey: true,
  originalName: true,
  mimeType: true,
  sizeBytes: true,
  width: true,
  height: true,
  durationSeconds: true,
  sortOrder: true,
} as const;

const PUBLIC_LINK_SELECT = {
  id: true,
  expiresAt: true,
  revokedAt: true,
  letter: {
    select: {
      id: true,
      type: true,
      status: true,
      title: true,
      recipientName: true,
      senderName: true,
      content: true,
      publishedAt: true,
      firstViewedAt: true,
      expiresAt: true,
      attachments: {
        where: {
          status: 'READY',
        },
        orderBy: {
          sortOrder: 'asc',
        },
        select: PUBLIC_ATTACHMENT_SELECT,
      },
    },
  },
} as const;

type SelectedPublicLink =
  Prisma.LetterLinkGetPayload<{
    select: typeof PUBLIC_LINK_SELECT;
  }>;

type SelectedPublicAttachment =
  SelectedPublicLink['letter']['attachments'][number];

@Injectable()
export class PublicLettersService {
  private readonly logger = new Logger(
    PublicLettersService.name,
  );

  constructor(
    private readonly prisma: PrismaService,
    private readonly mediaStorage: MediaStorage,
    private readonly shareTokenService:
      ShareTokenService,
  ) {}

  async resolvePublicLetter(
    token: string,
  ): Promise<PublicLetterResponse> {
    const shareLink =
      await this.findActiveShareLink(token);

    const viewedAt = new Date();

    await this.prisma.$transaction([
      this.prisma.letter.update({
        where: {
          id: shareLink.letter.id,
        },
        data: {
          firstViewedAt:
            shareLink.letter.firstViewedAt ??
            viewedAt,
          lastViewedAt: viewedAt,
          viewCount: {
            increment: 1,
          },
        },
      }),

      this.prisma.letterLink.update({
        where: {
          id: shareLink.id,
        },
        data: {
          lastAccessedAt: viewedAt,
          accessCount: {
            increment: 1,
          },
        },
      }),
    ]);

    return this.toPublicLetterResponse(
      shareLink,
      token,
    );
  }

  async openPublicAttachment(
    token: string,
    attachmentId: string,
  ): Promise<OpenedPublicAttachment> {
    const shareLink =
      await this.findActiveShareLink(token);

    const attachment =
      shareLink.letter.attachments.find(
        (item) => item.id === attachmentId,
      );

    if (!attachment) {
      throw new NotFoundException(
        'Attachment not found',
      );
    }

    try {
      const mediaObject =
        await this.mediaStorage.get(
          attachment.storageKey,
        );

      return {
        attachment:
          this.toPublicAttachmentResponse(
            attachment,
            token,
          ),
        stream: mediaObject.stream,
      };
    } catch {
      this.logger.error(
        `Stored media is missing for public attachment ${attachment.id}`,
      );

      throw new NotFoundException(
        'Attachment content is unavailable',
      );
    }
  }

  private async findActiveShareLink(
    token: string,
  ): Promise<SelectedPublicLink> {
    if (
      !this.shareTokenService.hasValidFormat(
        token,
      )
    ) {
      throw new NotFoundException(
        'Shared letter not found',
      );
    }

    const tokenHash =
      this.shareTokenService.hash(token);

    const shareLink =
      await this.prisma.letterLink.findUnique({
        where: {
          tokenHash,
        },
        select: PUBLIC_LINK_SELECT,
      });

    if (!shareLink) {
      throw new NotFoundException(
        'Shared letter not found',
      );
    }

    if (
      shareLink.revokedAt ||
      shareLink.letter.status === 'REVOKED'
    ) {
      throw new GoneException(
        'This letter link has been revoked',
      );
    }

    const effectiveExpiration =
      shareLink.expiresAt ??
      shareLink.letter.expiresAt;

    if (
      effectiveExpiration &&
      effectiveExpiration.getTime() <= Date.now()
    ) {
      await this.prisma.letter.updateMany({
        where: {
          id: shareLink.letter.id,
          status: 'PUBLISHED',
        },
        data: {
          status: 'EXPIRED',
        },
      });

      throw new GoneException(
        'This letter link has expired',
      );
    }

    if (
      shareLink.letter.status === 'EXPIRED'
    ) {
      throw new GoneException(
        'This letter link has expired',
      );
    }

    if (
      shareLink.letter.status !== 'PUBLISHED' ||
      !shareLink.letter.publishedAt
    ) {
      throw new NotFoundException(
        'Shared letter not found',
      );
    }

    return shareLink;
  }

  private toPublicLetterResponse(
    shareLink: SelectedPublicLink,
    token: string,
  ): PublicLetterResponse {
    const { letter } = shareLink;

    if (!letter.publishedAt) {
      throw new NotFoundException(
        'Shared letter not found',
      );
    }

    return {
      id: letter.id,
      type: letter.type,
      status: letter.status,
      title: letter.title,
      recipientName: letter.recipientName,
      senderName: letter.senderName,
      content: this.readContent(letter.content),
      publishedAt: letter.publishedAt,
      expiresAt:
        shareLink.expiresAt ??
        letter.expiresAt,
      attachments: letter.attachments.map(
        (attachment) =>
          this.toPublicAttachmentResponse(
            attachment,
            token,
          ),
      ),
    };
  }

  private toPublicAttachmentResponse(
    attachment: SelectedPublicAttachment,
    token: string,
  ): PublicAttachmentResponse {
    return {
      id: attachment.id,
      type: attachment.type,
      status: attachment.status,
      originalName: attachment.originalName,
      mimeType: attachment.mimeType,
      sizeBytes: attachment.sizeBytes,
      width: attachment.width,
      height: attachment.height,
      durationSeconds:
        attachment.durationSeconds,
      sortOrder: attachment.sortOrder,
      contentPath:
        `/public/letters/${token}` +
        `/attachments/${attachment.id}/content`,
    };
  }

  private readContent(
    content: Prisma.JsonValue,
  ): LetterContentV1 {
    if (
      typeof content !== 'object' ||
      content === null ||
      Array.isArray(content)
    ) {
      return {
        version: 1,
        body: '',
      };
    }

    const contentRecord = content as Record<
      string,
      unknown
    >;

    if (
      contentRecord.version !== 1 ||
      typeof contentRecord.body !== 'string'
    ) {
      return {
        version: 1,
        body: '',
      };
    }

    return {
      version: 1,
      body: contentRecord.body,
    };
  }
}