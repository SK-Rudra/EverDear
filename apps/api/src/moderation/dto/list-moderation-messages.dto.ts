import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import type {
  PublicMessageStatus,
  ReportStatus,
} from '../../generated/prisma/enums.js';
import {
  MODERATION_DEFAULT_PAGE_SIZE,
  MODERATION_MAX_PAGE_SIZE,
  MODERATION_MESSAGE_STATUSES,
  MODERATION_REPORT_STATUSES,
} from '../moderation.constants.js';

export class ListModerationMessagesDto {
  @IsOptional()
  @IsIn(MODERATION_MESSAGE_STATUSES)
  status?: PublicMessageStatus;

  @IsOptional()
  @IsIn(MODERATION_REPORT_STATUSES)
  reportStatus?: ReportStatus;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  query?: string;

  @IsOptional()
  @IsUUID('4')
  cursor?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MODERATION_MAX_PAGE_SIZE)
  limit: number = MODERATION_DEFAULT_PAGE_SIZE;
}