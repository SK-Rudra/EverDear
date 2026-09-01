import {
  IsISO8601,
  IsOptional,
} from 'class-validator';

export class CreateShareLinkDto {
  @IsOptional()
  @IsISO8601(
    {
      strict: true,
    },
    {
      message:
        'expiresAt must be a valid ISO 8601 date and time',
    },
  )
  expiresAt?: string | null;
}