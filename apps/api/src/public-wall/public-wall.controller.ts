import {
  Body,
  Controller,
  Get,
  Header,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { CreatePublicMessageDto } from './dto/create-public-message.dto.js';
import { CreatePublicReportDto } from './dto/create-public-report.dto.js';
import { ListPublicMessagesDto } from './dto/list-public-messages.dto.js';
import { PublicWallIdentityService } from './public-wall-identity.service.js';
import { PublicWallService } from './public-wall.service.js';
import type {
  PublicMessagePageResponse,
  PublicMessageResponse,
  PublicReportResponse,
} from './public-wall.types.js';

@Controller('public/messages')
export class PublicWallController {
  constructor(
    private readonly publicWallService:
      PublicWallService,
    private readonly identityService:
      PublicWallIdentityService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Header('Cache-Control', 'no-store')
  createMessage(
    @Body()
    createMessageDto: CreatePublicMessageDto,
    @Req() request: Request,
  ): Promise<PublicMessageResponse> {
    const authorHash =
      this.identityService.createRequestHash(
        request,
      );

    return this.publicWallService.createMessage(
      createMessageDto,
      authorHash,
    );
  }

  @Get()
  @Header('Cache-Control', 'no-store')
  listMessages(
    @Query() query: ListPublicMessagesDto,
  ): Promise<PublicMessagePageResponse> {
    return this.publicWallService.listMessages(
      query,
    );
  }

  @Post(':messageId/reports')
  @HttpCode(HttpStatus.ACCEPTED)
  @Header('Cache-Control', 'no-store')
  reportMessage(
    @Param(
      'messageId',
      new ParseUUIDPipe({
        version: '4',
      }),
    )
    messageId: string,
    @Body()
    createReportDto: CreatePublicReportDto,
    @Req() request: Request,
  ): Promise<PublicReportResponse> {
    const reporterHash =
      this.identityService.createRequestHash(
        request,
      );

    return this.publicWallService.reportMessage(
      messageId,
      createReportDto,
      reporterHash,
    );
  }
}