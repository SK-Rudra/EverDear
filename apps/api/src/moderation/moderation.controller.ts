import {
  Body,
  Controller,
  Get,
  Header,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import type { AuthenticatedUser } from '../auth/auth.types.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { RequireRoles } from '../auth/require-roles.decorator.js';
import { RoleAuthGuard } from '../auth/role-auth.guard.js';
import { SessionAuthGuard } from '../auth/session-auth.guard.js';
import { ListModerationHistoryDto } from './dto/list-moderation-history.dto.js';
import { ListModerationMessagesDto } from './dto/list-moderation-messages.dto.js';
import { ModerateMessageDto } from './dto/moderate-message.dto.js';
import { ResolveReportDto } from './dto/resolve-report.dto.js';
import { ModerationService } from './moderation.service.js';
import type {
  ModerationHistoryPageResponse,
  ModerationMessagePageResponse,
  ModerationMessageResponse,
  ModerationOverviewResponse,
} from './moderation.types.js';

@Controller('moderation')
@UseGuards(
  SessionAuthGuard,
  RoleAuthGuard,
)
@RequireRoles('MODERATOR', 'ADMIN')
export class ModerationController {
  constructor(
    private readonly moderationService:
      ModerationService,
  ) {}

  @Get('overview')
  @Header('Cache-Control', 'no-store')
  getOverview(): Promise<ModerationOverviewResponse> {
    return this.moderationService.getOverview();
  }

  @Get('messages')
  @Header('Cache-Control', 'no-store')
  listMessages(
    @Query()
    query: ListModerationMessagesDto,
  ): Promise<ModerationMessagePageResponse> {
    return this.moderationService.listMessages(
      query,
    );
  }

  @Get('history')
  @Header('Cache-Control', 'no-store')
  listHistory(
    @Query()
    query: ListModerationHistoryDto,
  ): Promise<ModerationHistoryPageResponse> {
    return this.moderationService.listHistory(
      query,
    );
  }

  @Patch('messages/:messageId')
  @Header('Cache-Control', 'no-store')
  moderateMessage(
    @Param(
      'messageId',
      new ParseUUIDPipe({
        version: '4',
      }),
    )
    messageId: string,
    @Body()
    input: ModerateMessageDto,
    @CurrentUser()
    actor: AuthenticatedUser,
  ): Promise<ModerationMessageResponse> {
    return this.moderationService.moderateMessage(
      messageId,
      input,
      actor,
    );
  }

  @Patch('reports/:reportId')
  @Header('Cache-Control', 'no-store')
  resolveReport(
    @Param(
      'reportId',
      new ParseUUIDPipe({
        version: '4',
      }),
    )
    reportId: string,
    @Body()
    input: ResolveReportDto,
    @CurrentUser()
    actor: AuthenticatedUser,
  ): Promise<ModerationMessageResponse> {
    return this.moderationService.resolveReport(
      reportId,
      input,
      actor,
    );
  }
}