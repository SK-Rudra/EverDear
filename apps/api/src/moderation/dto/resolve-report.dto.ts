import {
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import {
  MODERATION_NOTE_MAX_LENGTH,
  MODERATION_REPORT_RESOLUTIONS,
  type ModerationReportResolution,
} from '../moderation.constants.js';

export class ResolveReportDto {
  @IsIn(MODERATION_REPORT_RESOLUTIONS)
  resolution!: ModerationReportResolution;

  @IsOptional()
  @IsString()
  @MaxLength(MODERATION_NOTE_MAX_LENGTH)
  note?: string;
}