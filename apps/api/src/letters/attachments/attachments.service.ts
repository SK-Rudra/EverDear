import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { Prisma } from '../../generated/prisma/client.js';
import { MAX_ATTACHMENTS_PER_LETTER } from '../../media/media.constants.js';
import {
  MediaValidationService,
  type UploadedMediaFile,
} from '../../media/media-validation.service.js';
import { MediaStorage } from '../../media/storage/media-storage.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import type {
  AttachmentResponse,
  OpenedAttachment,
} from './attachment.types.js';

const ATTACHMENT_SELECT = {
  id: true,
  letterId: true,
  type: true,
  status: true,
  storageKey: true,
  thumbnailKey: true,
  originalName: true,
  mimeType: true,
  sizeBytes: true,
  width: true,
  height: true,
  durationSeconds: true,
  sortOrder: true,
  createdAt: true,
  updatedAt: true,
} as const;

type SelectedAttachment = Prisma.LetterAttachmentGetPayload<{
  select: typeof ATTACHMENT_SELECT;
}>;

@Injectable()
export class AttachmentsService {
  private readonly logger = new Logger(AttachmentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mediaStorage: MediaStorage,
    private readonly mediaValidation: MediaValidationService,
  ) {}

  async uploadAttachment(
    userId: string,
    letterId: string,
    file: UploadedMediaFile | undefined,
  ): Promise<AttachmentResponse> {
    await this.requireOwnedDraft(userId, letterId);

    const attachmentCount = await this.prisma.letterAttachment.count({
      where: {
        letterId,
      },
    });

    if (attachmentCount >= MAX_ATTACHMENTS_PER_LETTER) {
      throw new ConflictException(
        `A letter can contain up to ${MAX_ATTACHMENTS_PER_LETTER} attachments`,
      );
    }

    if (!file) {
      throw new BadRequestException('Choose a media file to upload.');
    }

    const [validatedMedia, lastAttachment] = await Promise.all([
      this.mediaValidation.validate(file),

      this.prisma.letterAttachment.findFirst({
        where: {
          letterId,
        },
        orderBy: {
          sortOrder: 'desc',
        },
        select: {
          sortOrder: true,
        },
      }),
    ]);

    const storageKey = [
      'letters',
      userId,
      letterId,
      `${randomUUID()}.${validatedMedia.extension}`,
    ].join('/');

    await this.mediaStorage.put({
      storageKey,
      buffer: file.buffer,
      mimeType: validatedMedia.mimeType,
    });

    try {
      const attachment = await this.prisma.letterAttachment.create({
        data: {
          letterId,
          type: validatedMedia.type,
          status: 'READY',
          storageKey,
          originalName: validatedMedia.originalName,
          mimeType: validatedMedia.mimeType,
          sizeBytes: validatedMedia.sizeBytes,
          sortOrder: (lastAttachment?.sortOrder ?? -1) + 1,
        },
        select: ATTACHMENT_SELECT,
      });

      return this.toAttachmentResponse(attachment);
    } catch (error: unknown) {
      await this.mediaStorage.delete(storageKey).catch(() => undefined);

      throw error;
    }
  }

  async findOwnedAttachments(
    userId: string,
    letterId: string,
  ): Promise<AttachmentResponse[]> {
    await this.requireOwnedLetter(userId, letterId);

    const attachments = await this.prisma.letterAttachment.findMany({
      where: {
        letterId,
      },
      orderBy: [
        {
          sortOrder: 'asc',
        },
        {
          createdAt: 'asc',
        },
      ],
      select: ATTACHMENT_SELECT,
    });

    return attachments.map((attachment) =>
      this.toAttachmentResponse(attachment),
    );
  }

  async openOwnedAttachment(
    userId: string,
    letterId: string,
    attachmentId: string,
  ): Promise<OpenedAttachment> {
    await this.requireOwnedLetter(userId, letterId);

    const attachment = await this.findAttachment(letterId, attachmentId);

    if (attachment.status !== 'READY') {
      throw new ConflictException('Attachment content is not ready');
    }

    try {
      const mediaObject = await this.mediaStorage.get(attachment.storageKey);

      return {
        attachment: this.toAttachmentResponse(attachment),
        stream: mediaObject.stream,
      };
    } catch {
      this.logger.error(
        `Stored media is missing for attachment ${attachment.id}`,
      );

      throw new NotFoundException('Attachment content is unavailable');
    }
  }

  async deleteAttachment(
    userId: string,
    letterId: string,
    attachmentId: string,
  ): Promise<void> {
    await this.requireOwnedDraft(userId, letterId);

    const attachment = await this.findAttachment(letterId, attachmentId);

    const deleteResult = await this.prisma.letterAttachment.deleteMany({
      where: {
        id: attachmentId,
        letterId,
      },
    });

    if (deleteResult.count === 0) {
      throw new NotFoundException('Attachment not found');
    }

    const storageKeys = [attachment.storageKey, attachment.thumbnailKey].filter(
      (storageKey): storageKey is string => Boolean(storageKey),
    );

    try {
      await Promise.all(
        storageKeys.map((storageKey) => this.mediaStorage.delete(storageKey)),
      );
    } catch {
      this.logger.warn(
        `An orphaned media object may remain for attachment ${attachment.id}`,
      );
    }
  }

  private async requireOwnedLetter(userId: string, letterId: string) {
    const letter = await this.prisma.letter.findFirst({
      where: {
        id: letterId,
        userId,
      },
      select: {
        id: true,
        status: true,
      },
    });

    if (!letter) {
      throw new NotFoundException('Letter not found');
    }

    return letter;
  }

  private async requireOwnedDraft(
    userId: string,
    letterId: string,
  ): Promise<void> {
    const letter = await this.requireOwnedLetter(userId, letterId);

    if (letter.status !== 'DRAFT') {
      throw new ConflictException(
        'Attachments can only be changed on draft letters',
      );
    }
  }

  private async findAttachment(
    letterId: string,
    attachmentId: string,
  ): Promise<SelectedAttachment> {
    const attachment = await this.prisma.letterAttachment.findFirst({
      where: {
        id: attachmentId,
        letterId,
      },
      select: ATTACHMENT_SELECT,
    });

    if (!attachment) {
      throw new NotFoundException('Attachment not found');
    }

    return attachment;
  }

  private toAttachmentResponse(
    attachment: SelectedAttachment,
  ): AttachmentResponse {
    return {
      id: attachment.id,
      letterId: attachment.letterId,
      type: attachment.type,
      status: attachment.status,
      originalName: attachment.originalName,
      mimeType: attachment.mimeType,
      sizeBytes: attachment.sizeBytes,
      width: attachment.width,
      height: attachment.height,
      durationSeconds: attachment.durationSeconds,
      sortOrder: attachment.sortOrder,
      contentPath:
        `/api/v1/letters/${attachment.letterId}` +
        `/attachments/${attachment.id}/content`,
      createdAt: attachment.createdAt,
      updatedAt: attachment.updatedAt,
    };
  }
}
