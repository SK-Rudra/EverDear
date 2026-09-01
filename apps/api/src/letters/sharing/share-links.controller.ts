import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import type { AuthenticatedUser } from '../../auth/auth.types.js';
import { CurrentUser } from '../../auth/current-user.decorator.js';
import { SessionAuthGuard } from '../../auth/session-auth.guard.js';
import { CreateShareLinkDto } from './dto/create-share-link.dto.js';
import { ShareLinksService } from './share-links.service.js';
import type {
  CreatedShareLinkResponse,
  ShareLinkResponse,
} from './share.types.js';

@Controller('letters/:letterId/share')
@UseGuards(SessionAuthGuard)
export class ShareLinksController {
  constructor(
    private readonly shareLinksService:
      ShareLinksService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  createOrRegenerate(
    @CurrentUser() user: AuthenticatedUser,
    @Param(
      'letterId',
      new ParseUUIDPipe({
        version: '4',
      }),
    )
    letterId: string,
    @Body()
    createShareLinkDto: CreateShareLinkDto,
  ): Promise<CreatedShareLinkResponse> {
    return this.shareLinksService.createOrRegenerate(
      user.id,
      letterId,
      createShareLinkDto,
    );
  }

  @Get()
  findOwnedShareLink(
    @CurrentUser() user: AuthenticatedUser,
    @Param(
      'letterId',
      new ParseUUIDPipe({
        version: '4',
      }),
    )
    letterId: string,
  ): Promise<ShareLinkResponse | null> {
    return this.shareLinksService.findOwnedShareLink(
      user.id,
      letterId,
    );
  }

  @Delete()
  revoke(
    @CurrentUser() user: AuthenticatedUser,
    @Param(
      'letterId',
      new ParseUUIDPipe({
        version: '4',
      }),
    )
    letterId: string,
  ): Promise<ShareLinkResponse> {
    return this.shareLinksService.revoke(
      user.id,
      letterId,
    );
  }
}