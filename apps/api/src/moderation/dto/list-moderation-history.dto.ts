import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import type { ModerationActionType } from '../../generated/prisma/enums.js';
import {
  MODERATION_ACTION_TYPES,
  MODERATION_DEFAULT_PAGE_SIZE,
  MODERATION_MAX_PAGE_SIZE,
} from '../moderation.constants.js';

export class ListModerationHistoryDto {
  @IsOptional()
  @IsIn(MODERATION_ACTION_TYPES)
  action?: ModerationActionType;

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