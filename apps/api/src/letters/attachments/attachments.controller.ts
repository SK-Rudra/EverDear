import {
  Controller,
  Delete,
  Get,
  Header,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  StreamableFile,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import type { AuthenticatedUser } from '../../auth/auth.types.js';
import { CurrentUser } from '../../auth/current-user.decorator.js';
import { SessionAuthGuard } from '../../auth/session-auth.guard.js';
import {
  MAX_UPLOAD_SIZE_BYTES,
} from '../../media/media.constants.js';
import type { UploadedMediaFile } from '../../media/media-validation.service.js';
import type { AttachmentResponse } from './attachment.types.js';
import { AttachmentsService } from './attachments.service.js';

@Controller('letters/:letterId/attachments')
@UseGuards(SessionAuthGuard)
export class AttachmentsController {
  constructor(
    private readonly attachmentsService:
      AttachmentsService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: {
        fileSize: MAX_UPLOAD_SIZE_BYTES,
        files: 1,
        fields: 0,
        parts: 2,
      },
    }),
  )
  uploadAttachment(
    @CurrentUser() user: AuthenticatedUser,
    @Param(
      'letterId',
      new ParseUUIDPipe({
        version: '4',
      }),
    )
    letterId: string,
    @UploadedFile()
    file: UploadedMediaFile | undefined,
  ): Promise<AttachmentResponse> {
    return this.attachmentsService.uploadAttachment(
      user.id,
      letterId,
      file,
    );
  }

  @Get()
  findOwnedAttachments(
    @CurrentUser() user: AuthenticatedUser,
    @Param(
      'letterId',
      new ParseUUIDPipe({
        version: '4',
      }),
    )
    letterId: string,
  ): Promise<AttachmentResponse[]> {
    return this.attachmentsService.findOwnedAttachments(
      user.id,
      letterId,
    );
  }

  @Get(':attachmentId/content')
  @Header(
    'Cache-Control',
    'private, max-age=300',
  )
  @Header('X-Content-Type-Options', 'nosniff')
  async openOwnedAttachment(
    @CurrentUser() user: AuthenticatedUser,
    @Param(
      'letterId',
      new ParseUUIDPipe({
        version: '4',
      }),
    )
    letterId: string,
    @Param(
      'attachmentId',
      new ParseUUIDPipe({
        version: '4',
      }),
    )
    attachmentId: string,
  ): Promise<StreamableFile> {
    const openedAttachment =
      await this.attachmentsService.openOwnedAttachment(
        user.id,
        letterId,
        attachmentId,
      );

    return new StreamableFile(
      openedAttachment.stream,
      {
        type: openedAttachment.attachment.mimeType,
        length:
          openedAttachment.attachment.sizeBytes,
        disposition:
          "inline; filename*=UTF-8''" +
          encodeURIComponent(
            openedAttachment.attachment.originalName,
          ),
      },
    );
  }

  @Delete(':attachmentId')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteAttachment(
    @CurrentUser() user: AuthenticatedUser,
    @Param(
      'letterId',
      new ParseUUIDPipe({
        version: '4',
      }),
    )
    letterId: string,
    @Param(
      'attachmentId',
      new ParseUUIDPipe({
        version: '4',
      }),
    )
    attachmentId: string,
  ): Promise<void> {
    return this.attachmentsService.deleteAttachment(
      user.id,
      letterId,
      attachmentId,
    );
  }
}