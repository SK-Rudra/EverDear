import {
  Controller,
  Get,
  Header,
  Param,
  ParseUUIDPipe,
  StreamableFile,
} from '@nestjs/common';
import { PublicLettersService } from './public-letters.service.js';
import type {
  PublicLetterResponse,
} from './share.types.js';

@Controller('public/letters')
export class PublicLettersController {
  constructor(
    private readonly publicLettersService:
      PublicLettersService,
  ) {}

  @Get(':token')
  @Header('Cache-Control', 'private, no-store')
  @Header('Referrer-Policy', 'no-referrer')
  @Header(
    'X-Robots-Tag',
    'noindex, nofollow, noarchive',
  )
  resolvePublicLetter(
    @Param('token') token: string,
  ): Promise<PublicLetterResponse> {
    return this.publicLettersService.resolvePublicLetter(
      token,
    );
  }

  @Get(':token/attachments/:attachmentId/content')
  @Header('Cache-Control', 'private, no-store')
  @Header('Referrer-Policy', 'no-referrer')
  @Header('X-Content-Type-Options', 'nosniff')
  async openPublicAttachment(
    @Param('token') token: string,
    @Param(
      'attachmentId',
      new ParseUUIDPipe({
        version: '4',
      }),
    )
    attachmentId: string,
  ): Promise<StreamableFile> {
    const openedAttachment =
      await this.publicLettersService.openPublicAttachment(
        token,
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
}