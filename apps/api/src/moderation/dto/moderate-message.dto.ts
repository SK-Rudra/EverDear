import {
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import {
  MODERATION_MESSAGE_ACTIONS,
  MODERATION_NOTE_MAX_LENGTH,
  type ModerationMessageAction,
} from '../moderation.constants.js';

export class ModerateMessageDto {
  @IsIn(MODERATION_MESSAGE_ACTIONS)
  action!: ModerationMessageAction;

  @IsOptional()
  @IsString()
  @MaxLength(MODERATION_NOTE_MAX_LENGTH)
  note?: string;
}