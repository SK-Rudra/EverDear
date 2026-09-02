
import {
  BadRequestException,
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreatePublicMessageDto } from './dto/create-public-message.dto.js';
import type { CreatePublicReportDto } from './dto/create-public-report.dto.js';
import type { ListPublicMessagesDto } from './dto/list-public-messages.dto.js';
import {
  PUBLIC_MESSAGE_LIFETIME_DAYS,
  PUBLIC_MESSAGE_MAX_LENGTH,
  PUBLIC_MESSAGE_MIN_LENGTH,
  PUBLIC_MESSAGE_RATE_LIMIT,
  PUBLIC_MESSAGE_RATE_WINDOW_MINUTES,
  PUBLIC_REPORT_AUTO_HIDE_THRESHOLD,
  PUBLIC_REPORT_RATE_LIMIT,
  PUBLIC_REPORT_RATE_WINDOW_MINUTES,
} from './public-wall.constants.js';
import type {
  PublicMessagePageResponse,
  PublicMessageResponse,
  PublicReportResponse,
} from './public-wall.types.js';

const MINUTE_IN_MILLISECONDS = 60 * 1000;
const DAY_IN_MILLISECONDS =
  24 * 60 * 60 * 1000;

const DUPLICATE_WINDOW_IN_MILLISECONDS =
  DAY_IN_MILLISECONDS;

const PUBLIC_MESSAGE_SELECT = {
  id: true,
  content: true,
  displayLocation: true,
  publishedAt: true,
  expiresAt: true,
} as const;

type SelectedPublicMessage =
  Prisma.PublicMessageGetPayload<{
    select: typeof PUBLIC_MESSAGE_SELECT;
  }>;

@Injectable()
export class PublicWallService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async createMessage(
    createMessageDto: CreatePublicMessageDto,
    authorHash: string,
  ): Promise<PublicMessageResponse> {
    this.rejectHoneypot(createMessageDto.website);

    const content = this.normalizeContent(
      createMessageDto.content,
    );

    if (
      content.length <
        PUBLIC_MESSAGE_MIN_LENGTH ||
      content.length >
        PUBLIC_MESSAGE_MAX_LENGTH
    ) {
      throw new BadRequestException(
        `Message must contain between ${PUBLIC_MESSAGE_MIN_LENGTH} and ${PUBLIC_MESSAGE_MAX_LENGTH} characters`,
      );
    }

    this.assertContentIsSafeForPublicDisplay(
      content,
    );

    const displayLocation =
      this.normalizeOptionalLine(
        createMessageDto.displayLocation,
      );

    const now = new Date();

    const rateWindowStart = new Date(
      now.getTime() -
        PUBLIC_MESSAGE_RATE_WINDOW_MINUTES *
          MINUTE_IN_MILLISECONDS,
    );

    const recentMessageCount =
      await this.prisma.publicMessage.count({
        where: {
          authorHash,
          createdAt: {
            gte: rateWindowStart,
          },
        },
      });

    if (
      recentMessageCount >=
      PUBLIC_MESSAGE_RATE_LIMIT
    ) {
      throw new HttpException(
        'Please wait before posting another message',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const duplicateWindowStart = new Date(
      now.getTime() -
        DUPLICATE_WINDOW_IN_MILLISECONDS,
    );

    const duplicateMessage =
      await this.prisma.publicMessage.findFirst({
        where: {
          authorHash,
          content,
          createdAt: {
            gte: duplicateWindowStart,
          },
        },
        select: {
          id: true,
        },
      });

    if (duplicateMessage) {
      throw new ConflictException(
        'This message was already submitted recently',
      );
    }

    const expiresAt = new Date(
      now.getTime() +
        PUBLIC_MESSAGE_LIFETIME_DAYS *
          DAY_IN_MILLISECONDS,
    );

    const message =
      await this.prisma.publicMessage.create({
        data: {
          userId: null,
          content,
          displayLocation,
          anonymous: true,
          authorHash,
          status: 'PUBLISHED',
          publishedAt: now,
          expiresAt,
        },
        select: PUBLIC_MESSAGE_SELECT,
      });

    return this.toPublicMessageResponse(message);
  }

  async listMessages(
    query: ListPublicMessagesDto,
  ): Promise<PublicMessagePageResponse> {
    const now = new Date();

    await this.expirePublishedMessages(now);

    const records =
      await this.prisma.publicMessage.findMany({
        where: {
          status: 'PUBLISHED',
          publishedAt: {
            lte: now,
          },
          expiresAt: {
            gt: now,
          },
        },
        ...(query.cursor
          ? {
              cursor: {
                id: query.cursor,
              },
              skip: 1,
            }
          : {}),
        orderBy: [
          {
            publishedAt: 'desc',
          },
          {
            id: 'desc',
          },
        ],
        take: query.limit + 1,
        select: PUBLIC_MESSAGE_SELECT,
      });

    const hasMore =
      records.length > query.limit;

    const visibleRecords = hasMore
      ? records.slice(0, query.limit)
      : records;

    const messages = visibleRecords.map(
      (message) =>
        this.toPublicMessageResponse(message),
    );

    return {
      messages,
      nextCursor:
        hasMore && messages.length > 0
          ? messages[messages.length - 1].id
          : null,
    };
  }

  async reportMessage(
    messageId: string,
    createReportDto: CreatePublicReportDto,
    reporterHash: string,
  ): Promise<PublicReportResponse> {
    this.rejectHoneypot(createReportDto.website);

    const now = new Date();

    await this.expirePublishedMessages(now);

    const message =
      await this.prisma.publicMessage.findFirst({
        where: {
          id: messageId,
          status: 'PUBLISHED',
          expiresAt: {
            gt: now,
          },
        },
        select: {
          id: true,
        },
      });

    if (!message) {
      throw new NotFoundException(
        'Public message not found',
      );
    }

    const reportWindowStart = new Date(
      now.getTime() -
        PUBLIC_REPORT_RATE_WINDOW_MINUTES *
          MINUTE_IN_MILLISECONDS,
    );

    const recentReportCount =
      await this.prisma.report.count({
        where: {
          reporterHash,
          createdAt: {
            gte: reportWindowStart,
          },
        },
      });

    if (
      recentReportCount >=
      PUBLIC_REPORT_RATE_LIMIT
    ) {
      throw new HttpException(
        'Please wait before submitting another report',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const existingReport =
      await this.prisma.report.findFirst({
        where: {
          messageId,
          reporterHash,
        },
        select: {
          id: true,
        },
      });

    if (existingReport) {
      throw new ConflictException(
        'You already reported this message',
      );
    }

    const details = this.normalizeOptionalText(
      createReportDto.details,
    );

    try {
      await this.prisma.$transaction(
        async (transaction) => {
          await transaction.report.create({
            data: {
              messageId,
              reporterUserId: null,
              reporterHash,
              reason: createReportDto.reason,
              details,
              status: 'PENDING',
            },
          });

          const pendingReportCount =
            await transaction.report.count({
              where: {
                messageId,
                status: 'PENDING',
              },
            });

          if (
            pendingReportCount >=
            PUBLIC_REPORT_AUTO_HIDE_THRESHOLD
          ) {
            await transaction.publicMessage.updateMany(
              {
                where: {
                  id: messageId,
                  status: 'PUBLISHED',
                },
                data: {
                  status: 'HIDDEN',
                },
              },
            );
          }
        },
      );
    } catch (error: unknown) {
      if (this.isUniqueConstraintError(error)) {
        throw new ConflictException(
          'You already reported this message',
        );
      }

      throw error;
    }

    return {
      accepted: true,
    };
  }

  private async expirePublishedMessages(
    now: Date,
  ): Promise<void> {
    await this.prisma.publicMessage.updateMany({
      where: {
        status: 'PUBLISHED',
        expiresAt: {
          lte: now,
        },
      },
      data: {
        status: 'EXPIRED',
      },
    });
  }

  private rejectHoneypot(
    website: string | undefined,
  ): void {
    if (website?.trim()) {
      throw new BadRequestException(
        'Unable to submit this request',
      );
    }
  }

  private normalizeContent(
    value: string,
  ): string {
    return this.removeControlCharacters(value)
      .replace(/\r\n?/g, '\n')
      .replace(/[ \t]+$/gm, '')
      .replace(/\n{4,}/g, '\n\n\n')
      .trim();
  }

  private normalizeOptionalLine(
    value: string | undefined,
  ): string | null {
    if (value === undefined) {
      return null;
    }

    const normalized =
      this.removeControlCharacters(value)
        .replace(/\s+/g, ' ')
        .trim();

    return normalized || null;
  }

  private normalizeOptionalText(
    value: string | undefined,
  ): string | null {
    if (value === undefined) {
      return null;
    }

    const normalized = this.normalizeContent(value);

    return normalized || null;
  }

  private removeControlCharacters(
    value: string,
  ): string {
    return Array.from(value)
      .filter((character) => {
        const code = character.charCodeAt(0);

        return (
          code === 9 ||
          code === 10 ||
          code >= 32
        );
      })
      .join('');
  }

  private assertContentIsSafeForPublicDisplay(
    content: string,
  ): void {
    const containsUrl =
      /(?:https?:\/\/|www\.)\S+/i.test(content);

    const containsEmail =
      /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i.test(
        content,
      );

    const numberCandidates =
      content.match(
        /(?:\+?\d[\d\s().-]{7,}\d)/g,
      ) ?? [];

    const containsPhoneLikeNumber =
      numberCandidates.some((candidate) => {
        const digitCount = Array.from(
          candidate,
        ).filter((character) =>
          /\d/.test(character),
        ).length;

        return digitCount >= 9;
      });

    if (
      containsUrl ||
      containsEmail ||
      containsPhoneLikeNumber
    ) {
      throw new BadRequestException(
        'For privacy, public messages cannot contain links, email addresses, or phone numbers',
      );
    }
  }

  private toPublicMessageResponse(
    message: SelectedPublicMessage,
  ): PublicMessageResponse {
    if (
      !message.publishedAt ||
      !message.expiresAt
    ) {
      throw new Error(
        'Published message has incomplete lifecycle dates',
      );
    }

    return {
      id: message.id,
      content: message.content,
      displayLocation:
        message.displayLocation,
      publishedAt: message.publishedAt,
      expiresAt: message.expiresAt,
    };
  }

  private isUniqueConstraintError(
    error: unknown,
  ): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 'P2002'
    );
  }
}
