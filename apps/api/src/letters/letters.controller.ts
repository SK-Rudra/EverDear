import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import type { AuthenticatedUser } from '../auth/auth.types.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { SessionAuthGuard } from '../auth/session-auth.guard.js';
import { CreateLetterDto } from './dto/create-letter.dto.js';
import { UpdateLetterDto } from './dto/update-letter.dto.js';
import type { LetterResponse } from './letter.types.js';
import { LettersService } from './letters.service.js';

@Controller('letters')
@UseGuards(SessionAuthGuard)
export class LettersController {
  constructor(
    private readonly lettersService: LettersService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  createDraft(
    @CurrentUser() user: AuthenticatedUser,
    @Body() createLetterDto: CreateLetterDto,
  ): Promise<LetterResponse> {
    return this.lettersService.createDraft(
      user.id,
      createLetterDto,
    );
  }

  @Get()
  findUserLetters(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<LetterResponse[]> {
    return this.lettersService.findUserLetters(
      user.id,
    );
  }

  @Get(':letterId')
  findOwnedLetter(
    @CurrentUser() user: AuthenticatedUser,
    @Param(
      'letterId',
      new ParseUUIDPipe({
        version: '4',
      }),
    )
    letterId: string,
  ): Promise<LetterResponse> {
    return this.lettersService.findOwnedLetter(
      user.id,
      letterId,
    );
  }

  @Patch(':letterId')
  updateDraft(
    @CurrentUser() user: AuthenticatedUser,
    @Param(
      'letterId',
      new ParseUUIDPipe({
        version: '4',
      }),
    )
    letterId: string,
    @Body() updateLetterDto: UpdateLetterDto,
  ): Promise<LetterResponse> {
    return this.lettersService.updateDraft(
      user.id,
      letterId,
      updateLetterDto,
    );
  }

  @Delete(':letterId')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteDraft(
    @CurrentUser() user: AuthenticatedUser,
    @Param(
      'letterId',
      new ParseUUIDPipe({
        version: '4',
      }),
    )
    letterId: string,
  ): Promise<void> {
    return this.lettersService.deleteDraft(
      user.id,
      letterId,
    );
  }
}