import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { AuthenticatedUser } from '../auth/auth.types.js';
import type { Prisma } from '../generated/prisma/client.js';
import type {
  ModerationActionType,
  PublicMessageStatus,
} from '../generated/prisma/enums.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { PUBLIC_MESSAGE_LIFETIME_DAYS } from '../public-wall/public-wall.constants.js';
import type { ListModerationHistoryDto } from './dto/list-moderation-history.dto.js';
import type { ListModerationMessagesDto } from './dto/list-moderation-messages.dto.js';
import type { ModerateMessageDto } from './dto/moderate-message.dto.js';
import type { ResolveReportDto } from './dto/resolve-report.dto.js';
import type {
  ModerationHistoryPageResponse,
  ModerationHistoryResponse,
  ModerationMessagePageResponse,
  ModerationMessageResponse,
  ModerationOverviewResponse,
  ModerationReportResponse,
} from './moderation.types.js';

const DAY_IN_MILLISECONDS =
  24 * 60 * 60 * 1000;

const MODERATION_REPORT_SELECT = {
  id: true,
  reason: true,
  details: true,
  status: true,
  createdAt: true,
  resolvedAt: true,
  resolver: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },
} as const;

const MODERATION_MESSAGE_SELECT = {
  id: true,
  content: true,
  displayLocation: true,
  status: true,
  publishedAt: true,
  expiresAt: true,
  createdAt: true,
  updatedAt: true,
  reports: {
    orderBy: {
      createdAt: 'desc',
    },
    take: 10,
    select: MODERATION_REPORT_SELECT,
  },
  _count: {
    select: {
      reports: true,
    },
  },
} as const;

const MODERATION_HISTORY_SELECT = {
  id: true,
  action: true,
  note: true,
  previousState: true,
  nextState: true,
  createdAt: true,
  actor: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },
  message: {
    select: {
      id: true,
      content: true,
    },
  },
  report: {
    select: {
      id: true,
      reason: true,
    },
  },
} as const;

type SelectedModerationMessage =
  Prisma.PublicMessageGetPayload<{
    select: typeof MODERATION_MESSAGE_SELECT;
  }>;

type SelectedModerationReport =
  Prisma.ReportGetPayload<{
    select: typeof MODERATION_REPORT_SELECT;
  }>;

type SelectedModerationHistory =
  Prisma.ModerationLogGetPayload<{
    select: typeof MODERATION_HISTORY_SELECT;
  }>;

@Injectable()
export class ModerationService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async getOverview(): Promise<ModerationOverviewResponse> {
    await this.expireMessages();

    const [messageCounts, reportCounts] =
      await Promise.all([
        this.prisma.publicMessage.groupBy({
          by: ['status'],
          _count: {
            _all: true,
          },
        }),
        this.prisma.report.groupBy({
          by: ['status'],
          _count: {
            _all: true,
          },
        }),
      ]);

    const overview: ModerationOverviewResponse = {
      messages: {
        pending: 0,
        published: 0,
        hidden: 0,
        removed: 0,
        expired: 0,
      },
      reports: {
        pending: 0,
        reviewed: 0,
        dismissed: 0,
        actioned: 0,
      },
    };

    for (const entry of messageCounts) {
      switch (entry.status) {
        case 'PENDING':
          overview.messages.pending =
            entry._count._all;
          break;
        case 'PUBLISHED':
          overview.messages.published =
            entry._count._all;
          break;
        case 'HIDDEN':
          overview.messages.hidden =
            entry._count._all;
          break;
        case 'REMOVED':
          overview.messages.removed =
            entry._count._all;
          break;
        case 'EXPIRED':
          overview.messages.expired =
            entry._count._all;
          break;
      }
    }

    for (const entry of reportCounts) {
      switch (entry.status) {
        case 'PENDING':
          overview.reports.pending =
            entry._count._all;
          break;
        case 'REVIEWED':
          overview.reports.reviewed =
            entry._count._all;
          break;
        case 'DISMISSED':
          overview.reports.dismissed =
            entry._count._all;
          break;
        case 'ACTIONED':
          overview.reports.actioned =
            entry._count._all;
          break;
      }
    }

    return overview;
  }

  async listMessages(
    query: ListModerationMessagesDto,
  ): Promise<ModerationMessagePageResponse> {
    await this.expireMessages();

    const searchQuery = query.query?.trim();

    const where: Prisma.PublicMessageWhereInput = {
      ...(query.status
        ? {
            status: query.status,
          }
        : {}),
      ...(query.reportStatus
        ? {
            reports: {
              some: {
                status: query.reportStatus,
              },
            },
          }
        : {}),
      ...(searchQuery
        ? {
            content: {
              contains: searchQuery,
              mode: 'insensitive',
            },
          }
        : {}),
    };

    const records =
      await this.prisma.publicMessage.findMany({
        where,
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
            updatedAt: 'desc',
          },
          {
            id: 'desc',
          },
        ],
        take: query.limit + 1,
        select: MODERATION_MESSAGE_SELECT,
      });

    const hasMore =
      records.length > query.limit;

    const visibleRecords = hasMore
      ? records.slice(0, query.limit)
      : records;

    const pendingReportCounts =
      await this.getPendingReportCounts(
        visibleRecords.map(
          (message) => message.id,
        ),
      );

    const messages = visibleRecords.map(
      (message) =>
        this.toModerationMessageResponse(
          message,
          pendingReportCounts.get(
            message.id,
          ) ?? 0,
        ),
    );

    return {
      messages,
      nextCursor:
        hasMore && messages.length > 0
          ? messages[messages.length - 1].id
          : null,
    };
  }

  async listHistory(
    query: ListModerationHistoryDto,
  ): Promise<ModerationHistoryPageResponse> {
    const records =
      await this.prisma.moderationLog.findMany({
        where: query.action
          ? {
              action: query.action,
            }
          : undefined,
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
            createdAt: 'desc',
          },
          {
            id: 'desc',
          },
        ],
        take: query.limit + 1,
        select: MODERATION_HISTORY_SELECT,
      });

    const hasMore =
      records.length > query.limit;

    const visibleRecords = hasMore
      ? records.slice(0, query.limit)
      : records;

    const history = visibleRecords.map(
      (record) =>
        this.toModerationHistoryResponse(
          record,
        ),
    );

    return {
      history,
      nextCursor:
        hasMore && history.length > 0
          ? history[history.length - 1].id
          : null,
    };
  }

  async moderateMessage(
    messageId: string,
    input: ModerateMessageDto,
    actor: AuthenticatedUser,
  ): Promise<ModerationMessageResponse> {
    const note = this.normalizeNote(
      input.note,
    );

    const now = new Date();

    await this.prisma.$transaction(
      async (transaction) => {
        const message =
          await transaction.publicMessage.findUnique(
            {
              where: {
                id: messageId,
              },
              select: {
                id: true,
                status: true,
                publishedAt: true,
                expiresAt: true,
              },
            },
          );

        if (!message) {
          throw new NotFoundException(
            'Public message not found',
          );
        }

        let nextStatus: PublicMessageStatus;
        let auditAction: ModerationActionType;
        let updateData: Prisma.PublicMessageUpdateInput;

        switch (input.action) {
          case 'PUBLISH': {
            if (message.status !== 'PENDING') {
              throw new ConflictException(
                'Only pending messages can be published',
              );
            }

            nextStatus = 'PUBLISHED';
            auditAction =
              'MESSAGE_PUBLISHED';
            updateData = {
              status: nextStatus,
              publishedAt: now,
              expiresAt:
                this.createFutureExpiration(now),
            };
            break;
          }

          case 'HIDE': {
            if (
              message.status !== 'PUBLISHED' &&
              message.status !== 'PENDING'
            ) {
              throw new ConflictException(
                'Only pending or published messages can be hidden',
              );
            }

            nextStatus = 'HIDDEN';
            auditAction = 'MESSAGE_HIDDEN';
            updateData = {
              status: nextStatus,
            };
            break;
          }

          case 'RESTORE': {
            if (message.status !== 'HIDDEN') {
              throw new ConflictException(
                'Only hidden messages can be restored',
              );
            }

            nextStatus = 'PUBLISHED';
            auditAction =
              'MESSAGE_RESTORED';

            const expirationIsValid =
              message.expiresAt &&
              message.expiresAt > now;

            updateData = {
              status: nextStatus,
              publishedAt:
                message.publishedAt ?? now,
              expiresAt: expirationIsValid
                ? message.expiresAt
                : this.createFutureExpiration(
                    now,
                  ),
            };
            break;
          }

          case 'REMOVE': {
            if (actor.role !== 'ADMIN') {
              throw new ForbiddenException(
                'Only administrators can remove messages',
              );
            }

            if (message.status === 'REMOVED') {
              throw new ConflictException(
                'Message is already removed',
              );
            }

            nextStatus = 'REMOVED';
            auditAction =
              'MESSAGE_REMOVED';
            updateData = {
              status: nextStatus,
            };
            break;
          }
        }

        await transaction.publicMessage.update({
          where: {
            id: message.id,
          },
          data: updateData,
        });

        await transaction.moderationLog.create({
          data: {
            actorUserId: actor.id,
            messageId: message.id,
            action: auditAction,
            note,
            previousState: message.status,
            nextState: nextStatus,
          },
        });
      },
    );

    return this.findModerationMessage(
      messageId,
    );
  }

  async resolveReport(
    reportId: string,
    input: ResolveReportDto,
    actor: AuthenticatedUser,
  ): Promise<ModerationMessageResponse> {
    const note = this.normalizeNote(
      input.note,
    );

    const now = new Date();

    let affectedMessageId = '';

    await this.prisma.$transaction(
      async (transaction) => {
        const report =
          await transaction.report.findUnique({
            where: {
              id: reportId,
            },
            select: {
              id: true,
              status: true,
              messageId: true,
              message: {
                select: {
                  id: true,
                  status: true,
                },
              },
            },
          });

        if (!report) {
          throw new NotFoundException(
            'Report not found',
          );
        }

        if (report.status !== 'PENDING') {
          throw new ConflictException(
            'This report has already been resolved',
          );
        }

        affectedMessageId =
          report.messageId;

        await transaction.report.update({
          where: {
            id: report.id,
          },
          data: {
            status: input.resolution,
            resolvedById: actor.id,
            resolvedAt: now,
          },
        });

        const reportAuditAction =
          this.getReportAuditAction(
            input.resolution,
          );

        await transaction.moderationLog.create({
          data: {
            actorUserId: actor.id,
            messageId: report.messageId,
            reportId: report.id,
            action: reportAuditAction,
            note,
            previousState: report.status,
            nextState: input.resolution,
          },
        });

        if (
          input.resolution === 'ACTIONED' &&
          (report.message.status ===
            'PUBLISHED' ||
            report.message.status ===
              'PENDING')
        ) {
          await transaction.publicMessage.update({
            where: {
              id: report.message.id,
            },
            data: {
              status: 'HIDDEN',
            },
          });

          await transaction.moderationLog.create({
            data: {
              actorUserId: actor.id,
              messageId: report.message.id,
              reportId: report.id,
              action: 'MESSAGE_HIDDEN',
              note:
                note ??
                'Message hidden while actioning a report',
              previousState:
                report.message.status,
              nextState: 'HIDDEN',
            },
          });
        }
      },
    );

    return this.findModerationMessage(
      affectedMessageId,
    );
  }

  private async findModerationMessage(
    messageId: string,
  ): Promise<ModerationMessageResponse> {
    const message =
      await this.prisma.publicMessage.findUnique({
        where: {
          id: messageId,
        },
        select: MODERATION_MESSAGE_SELECT,
      });

    if (!message) {
      throw new NotFoundException(
        'Public message not found',
      );
    }

    const pendingReportCount =
      await this.prisma.report.count({
        where: {
          messageId,
          status: 'PENDING',
        },
      });

    return this.toModerationMessageResponse(
      message,
      pendingReportCount,
    );
  }

  private async getPendingReportCounts(
    messageIds: string[],
  ): Promise<Map<string, number>> {
    if (messageIds.length === 0) {
      return new Map();
    }

    const counts =
      await this.prisma.report.groupBy({
        by: ['messageId'],
        where: {
          messageId: {
            in: messageIds,
          },
          status: 'PENDING',
        },
        _count: {
          _all: true,
        },
      });

    return new Map(
      counts.map((entry) => [
        entry.messageId,
        entry._count._all,
      ]),
    );
  }

  private async expireMessages(): Promise<void> {
    const now = new Date();

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

  private createFutureExpiration(
    now: Date,
  ): Date {
    return new Date(
      now.getTime() +
        PUBLIC_MESSAGE_LIFETIME_DAYS *
          DAY_IN_MILLISECONDS,
    );
  }

  private normalizeNote(
    note: string | undefined,
  ): string | null {
    if (note === undefined) {
      return null;
    }

    const normalized = note.trim();

    return normalized || null;
  }

  private getReportAuditAction(
    resolution:
      | 'REVIEWED'
      | 'DISMISSED'
      | 'ACTIONED',
  ): ModerationActionType {
    switch (resolution) {
      case 'REVIEWED':
        return 'REPORT_REVIEWED';
      case 'DISMISSED':
        return 'REPORT_DISMISSED';
      case 'ACTIONED':
        return 'REPORT_ACTIONED';
    }
  }

  private toModerationMessageResponse(
    message: SelectedModerationMessage,
    pendingReportCount: number,
  ): ModerationMessageResponse {
    return {
      id: message.id,
      content: message.content,
      displayLocation:
        message.displayLocation,
      status: message.status,
      publishedAt: message.publishedAt,
      expiresAt: message.expiresAt,
      createdAt: message.createdAt,
      updatedAt: message.updatedAt,
      reportCount: message._count.reports,
      pendingReportCount,
      reports: message.reports.map(
        (report) =>
          this.toModerationReportResponse(
            report,
          ),
      ),
    };
  }

  private toModerationReportResponse(
    report: SelectedModerationReport,
  ): ModerationReportResponse {
    return {
      id: report.id,
      reason: report.reason,
      details: report.details,
      status: report.status,
      createdAt: report.createdAt,
      resolvedAt: report.resolvedAt,
      resolver: report.resolver,
    };
  }

  private toModerationHistoryResponse(
    record: SelectedModerationHistory,
  ): ModerationHistoryResponse {
    return {
      id: record.id,
      action: record.action,
      note: record.note,
      previousState: record.previousState,
      nextState: record.nextState,
      createdAt: record.createdAt,
      actor: record.actor,
      message: record.message,
      report: record.report,
    };
  }
}