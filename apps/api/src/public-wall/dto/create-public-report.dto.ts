import {
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import {
  PUBLIC_REPORT_REASONS,
  type PublicReportReason,
} from '../public-wall.constants.js';

export class CreatePublicReportDto {
  @IsString()
  @IsIn(PUBLIC_REPORT_REASONS)
  reason!: PublicReportReason;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  details?: string;

  /*
   * Honeypot field. It should remain empty.
   */
  @IsOptional()
  @IsString()
  @MaxLength(200)
  website?: string;
}