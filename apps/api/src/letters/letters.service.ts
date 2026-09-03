import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import type { Prisma } from '../generated/prisma/client.js';
import { MediaStorage } from '../media/storage/media-storage.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreateLetterDto } from './dto/create-letter.dto.js';
import type { UpdateLetterDto } from './dto/update-letter.dto.js';
import type { LetterContentV1, LetterResponse } from './letter.types.js';

const LETTER_SELECT = {
  id: true,
  type: true,
  status: true,
  title: true,
  recipientName: true,
  senderName: true,
  content: true,
  publishedAt: true,
  firstViewedAt: true,
  lastViewedAt: true,
  viewCount: true,
  expiresAt: true,
  createdAt: true,
  updatedAt: true,
} as const;

type SelectedLetter = Prisma.LetterGetPayload<{
  select: typeof LETTER_SELECT;
}>;

@Injectable()
export class LettersService {
  private readonly logger = new Logger(LettersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mediaStorage: MediaStorage,
  ) {}

  async createDraft(
    userId: string,
    createLetterDto: CreateLetterDto,
  ): Promise<LetterResponse> {
    const letter = await this.prisma.letter.create({
      data: {
        userId,
        type: createLetterDto.type,
        title: createLetterDto.title ?? null,
        recipientName: createLetterDto.recipientName,
        senderName: createLetterDto.senderName,
        content: this.createContent(createLetterDto.content?.body ?? ''),
      },
      select: LETTER_SELECT,
    });

    return this.toLetterResponse(letter);
  }

  async findUserLetters(userId: string): Promise<LetterResponse[]> {
    const letters = await this.prisma.letter.findMany({
      where: {
        userId,
      },
      orderBy: {
        updatedAt: 'desc',
      },
      take: 50,
      select: LETTER_SELECT,
    });

    return letters.map((letter) => this.toLetterResponse(letter));
  }

  async findOwnedLetter(
    userId: string,
    letterId: string,
  ): Promise<LetterResponse> {
    const letter = await this.prisma.letter.findFirst({
      where: {
        id: letterId,
        userId,
      },
      select: LETTER_SELECT,
    });

    if (!letter) {
      throw new NotFoundException('Letter not found');
    }

    return this.toLetterResponse(letter);
  }

  async updateDraft(
    userId: string,
    letterId: string,
    updateLetterDto: UpdateLetterDto,
  ): Promise<LetterResponse> {
    const hasUpdate = [
      updateLetterDto.type,
      updateLetterDto.recipientName,
      updateLetterDto.senderName,
      updateLetterDto.title,
      updateLetterDto.content,
    ].some((value) => value !== undefined);

    if (!hasUpdate) {
      throw new BadRequestException('Provide at least one field to update');
    }

    const updateData = {
      ...(updateLetterDto.type !== undefined
        ? {
            type: updateLetterDto.type,
          }
        : {}),

      ...(updateLetterDto.recipientName !== undefined
        ? {
            recipientName: updateLetterDto.recipientName,
          }
        : {}),

      ...(updateLetterDto.senderName !== undefined
        ? {
            senderName: updateLetterDto.senderName,
          }
        : {}),

      ...(updateLetterDto.title !== undefined
        ? {
            title: updateLetterDto.title,
          }
        : {}),

      ...(updateLetterDto.content !== undefined
        ? {
            content: this.createContent(updateLetterDto.content.body),
          }
        : {}),
    };

    const updateResult = await this.prisma.letter.updateMany({
      where: {
        id: letterId,
        userId,
        status: 'DRAFT',
      },
      data: updateData,
    });

    if (updateResult.count === 0) {
      await this.throwDraftMutationError(userId, letterId, 'edited');
    }

    return this.findOwnedLetter(userId, letterId);
  }

  async deleteLetter(userId: string, letterId: string): Promise<void> {
    const letter = await this.prisma.letter.findFirst({
      where: {
        id: letterId,
        userId,
      },
      select: {
        attachments: {
          select: {
            storageKey: true,
            thumbnailKey: true,
          },
        },
      },
    });

    if (!letter) {
      throw new NotFoundException('Letter not found');
    }

    const deleteResult = await this.prisma.letter.deleteMany({
      where: {
        id: letterId,
        userId,
      },
    });

    if (deleteResult.count === 0) {
      throw new NotFoundException('Letter not found');
    }

    await this.removeStoredAttachments(letterId, letter.attachments);
  }

  private async removeStoredAttachments(
    letterId: string,
    attachments: Array<{
      storageKey: string;
      thumbnailKey: string | null;
    }>,
  ): Promise<void> {
    const storageKeys = [
      ...new Set(
        attachments.flatMap((attachment) => [
          attachment.storageKey,
          ...(attachment.thumbnailKey ? [attachment.thumbnailKey] : []),
        ]),
      ),
    ];

    const deletionResults = await Promise.allSettled(
      storageKeys.map((storageKey) => this.mediaStorage.delete(storageKey)),
    );

    const failureCount = deletionResults.filter(
      (result) => result.status === 'rejected',
    ).length;

    if (failureCount > 0) {
      this.logger.warn(
        `${failureCount} media object(s) could not be removed for deleted letter ${letterId}`,
      );
    }
  }

  private async throwDraftMutationError(
    userId: string,
    letterId: string,
    action: string,
  ): Promise<never> {
    const letter = await this.prisma.letter.findFirst({
      where: {
        id: letterId,
        userId,
      },
      select: {
        id: true,
      },
    });

    if (!letter) {
      throw new NotFoundException('Letter not found');
    }

    throw new ConflictException(`Only draft letters can be ${action}`);
  }

  private createContent(body: string): LetterContentV1 {
    return {
      version: 1,
      body,
    };
  }

  private readContent(content: Prisma.JsonValue): LetterContentV1 {
    if (
      typeof content !== 'object' ||
      content === null ||
      Array.isArray(content)
    ) {
      return this.createContent('');
    }

    const contentRecord = content as Record<string, unknown>;

    if (contentRecord.version !== 1 || typeof contentRecord.body !== 'string') {
      return this.createContent('');
    }

    return {
      version: 1,
      body: contentRecord.body,
    };
  }

  private toLetterResponse(letter: SelectedLetter): LetterResponse {
    return {
      id: letter.id,
      type: letter.type,
      status: letter.status,
      title: letter.title,
      recipientName: letter.recipientName,
      senderName: letter.senderName,
      content: this.readContent(letter.content),
      publishedAt: letter.publishedAt,
      firstViewedAt: letter.firstViewedAt,
      lastViewedAt: letter.lastViewedAt,
      viewCount: letter.viewCount,
      expiresAt: letter.expiresAt,
      createdAt: letter.createdAt,
      updatedAt: letter.updatedAt,
    };
  }
}
