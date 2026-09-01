import {
  Transform,
  Type,
} from 'class-transformer';
import {
  IsIn,
  IsOptional,
  IsString,
  Length,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import {
  LETTER_TYPES,
  type LetterTypeValue,
} from '../letter.constants.js';
import { LetterContentDto } from './letter-content.dto.js';

export class CreateLetterDto {
  @IsIn(LETTER_TYPES)
  type!: LetterTypeValue;

  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string'
      ? value.trim()
      : value,
  )
  @IsString()
  @Length(1, 120)
  recipientName!: string;

  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string'
      ? value.trim()
      : value,
  )
  @IsString()
  @Length(1, 120)
  senderName!: string;

  @Transform(({ value }: { value: unknown }) => {
    if (typeof value !== 'string') {
      return value;
    }

    const normalized = value.trim();

    return normalized || undefined;
  })
  @IsOptional()
  @IsString()
  @MaxLength(160)
  title?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => LetterContentDto)
  content?: LetterContentDto;
}